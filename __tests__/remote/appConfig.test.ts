import {getAdConfig} from '../../src/remote/appConfig';
import {ADS_OFF} from '../../src/domain/adFrequency';
import {supabase} from '../../src/lib/supabase';

jest.mock('../../src/lib/supabase', () => ({supabase: {from: jest.fn()}}));
const mockFrom = supabase.from as jest.Mock;

let eq: jest.Mock;
let select: jest.Mock;
const mockResult = (result: {data: unknown; error: unknown}) => {
  const maybeSingle = jest.fn().mockResolvedValue(result);
  eq = jest.fn(() => ({maybeSingle}));
  select = jest.fn(() => ({eq}));
  mockFrom.mockReturnValue({select});
};
const mockRow = (data: unknown) => mockResult({data, error: null});
const mockError = (error: unknown) => mockResult({data: null, error});

describe('remote/appConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('행을 읽어 AdConfig 로 바꾼다', async () => {
    mockRow({ads_enabled: true, interstitial_enabled: true, interstitial_daily_cap: 3,
             interstitial_min_gap_seconds: 60, interstitial_grace_workouts: 2});
    await expect(getAdConfig()).resolves.toEqual(
      {adsEnabled: true, interstitialEnabled: true, dailyCap: 3, minGapSeconds: 60, graceWorkouts: 2});
    expect(mockFrom).toHaveBeenCalledWith('app_config');
    expect(eq).toHaveBeenCalledWith('id', 'default');
  });
  it('행이 없으면 광고 꺼진 기본값을 돌려준다', async () => {
    mockRow(null);
    await expect(getAdConfig()).resolves.toEqual(ADS_OFF);
  });
  it('조회가 실패해도 예외 대신 꺼진 기본값을 돌려준다', async () => {
    mockError({message: 'network'});
    await expect(getAdConfig()).resolves.toEqual(ADS_OFF);
    expect(console.warn).toHaveBeenCalled();
  });
});
