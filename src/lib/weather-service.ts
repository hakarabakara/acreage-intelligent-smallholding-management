import type { WeatherLog } from '@shared/types';
export interface WeatherData {
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    condition: WeatherLog['condition'];
    code: number;
  };
  daily: {
    tempHigh: number;
    tempLow: number;
    precipitation: number;
  };
}
export async function getWeatherForecast(lat: number, lng: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
    timezone: 'auto',
    forecast_days: '1'
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch weather data');
  const data = await res.json();
  return {
    current: {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      condition: mapWmoCodeToCondition(data.current.weather_code),
      code: data.current.weather_code
    },
    daily: {
      tempHigh: Math.round(data.daily.temperature_2m_max[0]),
      tempLow: Math.round(data.daily.temperature_2m_min[0]),
      precipitation: data.daily.precipitation_sum[0]
    }
  };
}
function mapWmoCodeToCondition(code: number): WeatherLog['condition'] {
  if (code === 0) return 'sunny';
  if ([1, 2, 3, 45, 48].includes(code)) return 'cloudy';
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'rainy';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snowy';
  if ([95, 96, 99].includes(code)) return 'stormy';
  return 'sunny'; // Default
}