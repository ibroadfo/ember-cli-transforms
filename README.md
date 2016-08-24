# ember-cli-transforms

An ember-cli addon that lets you apply arbitrary transformations to specific files at the end of a build.

[![Build Status](https://travis-ci.org/dbazile/ember-cli-transforms.svg?branch=master)](https://travis-ci.org/dbazile/ember-cli-transforms)


## Installation

```shell
ember install ember-cli-transforms
```


## Usage

In your app's `ember-cli-build.js`, define `transforms` options on your app instance as such:

```javascript
const app = new EmberApp(defaults, {
  transforms: {
    targets: [
      {
        pattern: 'index.html',
        rename: (originalPath) => originalPath.replace(/\.html$/, '.jsp'),
        transform: (content, originalPath) => content.replace(/laughter/g, 'tears')
      },
      {
        pattern: '**/*.css',
        transform: (content, originalPath) => content.replace(/.\/fonts\//g, 'http://somecdn/fonts/')
      }
    ]
  }
});
```

Transforms will only be applied in the production environment.


## Options

### transforms.targets: `object[]`

An array of _target_ objects and their transforms.  Defaults to `[]`.

A _target_ is a simple object that looks like this:

```javascript
const target = {
  
  /**
   * @required
   * @type string
   */
  pattern: '**/*.js',

  /**
   * @optional
   * @param {string} relativePath - The current path of the file being processed
   * @return {string} New path for the file being processed
   */
  rename: function(relativePath) {},

  /**
   * @optional
   * @param {string} content      - the current contents of the file being processed
   * @param {string} relativePath - the current path of the file being processed
   * @return {string} New contents for the file being processed
   */
  transform: function(content, relativePath) {}
  
}
```

Technically there's nothing stopping you from defining a _target_ without a `rename` or `transform` methods&mdash;that'd just be kind of pointless.

### transforms.extensions: `string[]`

An array of file extensions that will be processed.  Defaults to `['css', 'html', 'js']`.
