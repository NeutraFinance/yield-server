const utils = require('../utils');
const { gql, default: request } = require('graphql-request');
const { getTvl } = require('./contract');
const { getApy } = require('./contract');

const ARKIVER_GRAPHQL_URL =
  'https://data.arkiver.net/s_battenally/vaults/graphql';
const VAULT_STATS_URL =
  'https://api.thegraph.com/subgraphs/name/xayaneu/neutra-vault-migration';

const poolsFunction = async () => {
  const nGlpQuery = gql`
    {
      vaults(first: 1, orderDirection: desc) {
        id
        nGlpPrice
        esNeuApr
        nGlpApr
      }
    }
  `;

  const nUSDCQuery = gql`
    query GetVaultApy {
      VaultApy(
        filter: { vault: "0x2a958665bC9A1680135241133569C7014230Cb21" }
        sort: TIMESTAMP_DESC
      ) {
        apy14d
      }
    }
  `;

  let nusdcAPY = await request(ARKIVER_GRAPHQL_URL, nUSDCQuery);

  let nGlpAPY = await request(VAULT_STATS_URL, nGlpQuery);

  const tvl = await getTvl();
  const getAPY = await getApy();

  const GlpPool = {
    pool: '0x6Bfa4F1DfAfeb9c37E4E8d436E1d0C5973E47e25',
    chain: utils.formatChain('arbitrum'),
    project: 'neutra-finance',
    symbol: utils.formatSymbol('DAI'),
    tvlUsd: Number(tvl[1]),
    apy:
      (Number(nGlpAPY.vaults[0].esNeuApr) + Number(nGlpAPY.vaults[0].nGlpApr)) /
      1e18,
  };

  const nUSDCPool = {
    pool: '0x2a958665bC9A1680135241133569C7014230Cb21',
    chain: utils.formatChain('arbitrum'),
    project: 'neutra-finance',
    symbol: utils.formatSymbol('USDC'),
    tvlUsd: Number(tvl[0]),
    apy: nusdcAPY.VaultApy.apy14d * 100 + getAPY,
  };

  return [GlpPool, nUSDCPool];
};

module.exports = {
  timetravel: false,
  apy: poolsFunction,
  url: 'https://neutra.finance',
};
