'use strict';

const TransformFilter = require('./lib/transform-filter');

module.exports = {
  name: 'ember-cli-transforms',

  included(app) {
    this._super.included.apply(this, arguments);
    this.isProductionBuild = app.env === 'production';
    this.options = generateOptions(app.options.transforms || {});
  },

  postprocessTree(type, tree) {
    if (type === 'all' && this.isProductionBuild) {
      return new TransformFilter(tree, this.options);
    }
    return tree;
  }
};

function generateOptions(options) {
  if (options.extensions && !Array.isArray(options.extensions)) {
    throw new Error('`transforms.extensions` must be an array of file extensions');
  }
  if (options.targets && !Array.isArray(options.targets)) {
    throw new Error('`transforms.targets` must be an array of transforms');
  }
  if (options.targets && options.targets.find(t => !t.pattern)) {
    throw new Error('`transforms.targets`: all transforms require a `pattern` string');
  }
  return Object.assign({
    targets: [],
    extensions: ['html', 'js', 'css']
  }, options);
}
