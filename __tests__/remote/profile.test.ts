import {createDefaultProfile, findProfile} from '../../src/remote/profile';
import {supabase} from '../../src/lib/supabase';

jest.mock('../../src/lib/supabase', () => ({
  supabase: {from: jest.fn()},
}));

const mockFrom = supabase.from as jest.Mock;

/** profiles.insert(...).select().single() 호출 체인을 흉내낸다 */
function mockInsertResults(results: Array<{data: unknown; error: unknown}>) {
  const insert = jest.fn();
  results.forEach(r => {
    insert.mockReturnValueOnce({
      select: () => ({single: () => Promise.resolve(r)}),
    });
  });
  mockFrom.mockReturnValue({insert});
  return insert;
}

describe('createDefaultProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('user-xxxxxxxx 형식의 랜덤 닉네임으로 프로필을 만든다', async () => {
    const insert = mockInsertResults([{data: {id: 'u1', nickname: 'user-abc'}, error: null}]);

    const profile = await createDefaultProfile('u1');

    expect(mockFrom).toHaveBeenCalledWith('profiles');
    const inserted = insert.mock.calls[0][0];
    expect(inserted.id).toBe('u1');
    expect(inserted.nickname).toMatch(/^user-[a-z0-9]{8}$/);
    expect(profile).toEqual({id: 'u1', nickname: 'user-abc'});
  });

  it('닉네임이 중복(23505)이면 새 닉네임으로 다시 시도한다', async () => {
    const insert = mockInsertResults([
      {data: null, error: {code: '23505', message: 'duplicate key'}},
      {data: {id: 'u1', nickname: 'user-second'}, error: null},
    ]);

    const profile = await createDefaultProfile('u1');

    expect(insert).toHaveBeenCalledTimes(2);
    expect(insert.mock.calls[0][0].nickname).not.toBe(insert.mock.calls[1][0].nickname);
    expect(profile.nickname).toBe('user-second');
  });

  it('중복이 아닌 오류는 재시도 없이 던진다', async () => {
    const insert = mockInsertResults([
      {data: null, error: {code: '23502', message: 'null value'}},
    ]);

    await expect(createDefaultProfile('u1')).rejects.toMatchObject({code: '23502'});
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it('중복이 계속되면 3회까지만 시도하고 던진다', async () => {
    const dup = {data: null, error: {code: '23505', message: 'duplicate key'}};
    const insert = mockInsertResults([dup, dup, dup, dup]);

    await expect(createDefaultProfile('u1')).rejects.toMatchObject({code: '23505'});
    expect(insert).toHaveBeenCalledTimes(3);
  });
});

function mockSelectSingle(result: {data: unknown; error: unknown}) {
  mockFrom.mockReturnValue({
    select: () => ({eq: () => ({single: () => Promise.resolve(result)})}),
  });
}

describe('findProfile', () => {
  beforeEach(() => jest.clearAllMocks());

  it('프로필이 있으면 돌려준다', async () => {
    mockSelectSingle({data: {id: 'u1', nickname: 'n'}, error: null});
    await expect(findProfile('u1')).resolves.toEqual({id: 'u1', nickname: 'n'});
  });

  it('행이 없으면(PGRST116) null 을 돌려준다', async () => {
    mockSelectSingle({data: null, error: {code: 'PGRST116', message: 'no rows'}});
    await expect(findProfile('u1')).resolves.toBeNull();
  });

  it('그 외 오류는 던진다', async () => {
    mockSelectSingle({data: null, error: {code: '42501', message: 'permission denied'}});
    await expect(findProfile('u1')).rejects.toMatchObject({code: '42501'});
  });
});
