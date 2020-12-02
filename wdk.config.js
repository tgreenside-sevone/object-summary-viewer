const { consumedFacets, producedFacets } = require('./facets');

module.exports = {
  wrapper: './wrapper.tsx',
  onCreateBabelConfig: ({ baseConfig }) => {
    baseConfig.plugins.push('@babel/plugin-proposal-optional-chaining');
    baseConfig.presets.push('@babel/preset-typescript');

    return baseConfig;
  },
  onCreateWebpackConfig: ({ mode, baseConfig }) => {
    if (mode === 'production') {
      // eslint-disable-next-line
      baseConfig.externals['@sevone/insight-connect'] = {
        root: 'insightConnect',
        commonjs2: '@sevone/insight-connect',
        commonjs: '@sevone/insight-connect',
        amd: '@sevone/insight-connect'
      };
    }

    return baseConfig;
  },
  onCreateWidgetMeta: ({ baseMeta }) => {
    const customMeta = { ...baseMeta };

    customMeta.consumedFacets = Object.values(consumedFacets);
    customMeta.producedFacets = Object.values(producedFacets);

    return customMeta;
  }
};
