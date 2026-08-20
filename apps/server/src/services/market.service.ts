const COINGECKO_API = 'https://api.coingecko.com/api/v3';

type FetchOptions = {
  params?: Record<string, string>;
};

async function geckoFetch<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const url = new URL(`${COINGECKO_API}${endpoint}`);

  for (const [key, value] of Object.entries(options.params ?? {})) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `CoinGecko request failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<T>;
}

export async function getGlobalMarket() {
  return geckoFetch('/global');
}

export async function getMarketCoins() {
  return geckoFetch('/coins/markets', {
    params: {
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: '50',
      page: '1',
      sparkline: 'true',
      price_change_percentage: '1h,24h,7d',
    },
  });
}

export async function getTrendingCoins() {
  return geckoFetch('/search/trending');
}

export async function getMarketOverview() {
  const [global, coins, trending] = await Promise.all([
    getGlobalMarket(),
    getMarketCoins(),
    getTrendingCoins(),
  ]);

  return {
    provider: 'CoinGecko',
    updatedAt: new Date().toISOString(),
    global,
    coins,
    trending,
  };
}
