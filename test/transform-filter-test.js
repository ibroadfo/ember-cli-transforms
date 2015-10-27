/* eslint-env mocha */
'use strict';

//global.DEBUG = true;

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const broccoliTestHelpers = require('broccoli-test-helpers');
const TransformFilter = require('../lib/transform-filter');

describe('TransformFilter', () => {
  let build;

  beforeEach(() => {
    build = broccoliTestHelpers.makeTestHelper({
      fixturePath: __dirname,
      subject(tree, options) {
        return new TransformFilter(tree, Object.assign({
          extensions: ['js', 'html', 'css']
        }, options));
      }
    });
  });

  afterEach(() => {
    broccoliTestHelpers.cleanupBuilders();
  });

  it('handles content transforms', () => {
    const expectedContent = 'single-transform success';
    const expectedFile = 'index.html';
    const target = {
      pattern: 'index.html',
      transform: () => expectedContent
    };
    return build('fixtures/single-file', {targets: [target]})
      .then(results => {
        assert.equal(readSingle(results), expectedContent);
        assert.deepEqual(results.files, [expectedFile]);
      });
  });

  it('handles path transforms', () => {
    const expectedFile   = 'somewhere/index.jsp';
    const target = {
      pattern: 'index.html',
      rename: () => expectedFile
    };
    return build('fixtures/single-file', {targets: [target]})
      .then(results => {
        assert.deepEqual(results.files.sort(), ['somewhere/', expectedFile]);
      });
  });

  it('passes correct arguments to content transforms', () => {
    const expectedRawContent = '<body>Unchanged</body>\n';
    const expectedPath = 'index.html';
    const target = {
      pattern: 'index.html',
      transform(content, path_) {
        assert.equal(arguments.length, 2);
        assert.equal(content, expectedRawContent);
        assert.equal(path_, expectedPath);
      }
    };
    return build('fixtures/single-file', {targets: [target]});
  });

  it('passes correct arguments to path transforms', () => {
    const expectedPath = 'index.html';
    const target = {
      pattern: 'index.html',
      rename(path_) {
        assert.equal(arguments.length, 1);
        assert.equal(path_, expectedPath);
        return path_;
      }
    };
    return build('fixtures/single-file', {targets: [target]});
  });

  it('calls transforms correct number of times for a given file', () => {
    let transformCount = 0;
    let renameCount = 0;
    const target = {
      pattern: 'index.html',
      rename(path_) {
        renameCount += 1;
        return path_;
      },
      transform() {
        transformCount += 1;
      }
    };
    return build('fixtures/single-file', {targets: [target]})
      .then(() => {
        assert.equal(renameCount, 2, 'Calls `rename` twice (because that\'s how Broccoli gets down)');
        assert.equal(transformCount, 1, 'Calls `transform` once');
      });
  });

  it('handles cascading content transforms', () => {
    const expectedIntermediateContent = 'expected intermediate content';
    const expectedFinalContent = 'expected final content';
    const target1 = {
      pattern: 'index.html',
      transform: () => expectedIntermediateContent
    };
    const target2 = {
      pattern: 'index.html',
      transform(content) {
        assert.equal(content, expectedIntermediateContent);
        return expectedFinalContent;
      }
    };
    return build('fixtures/single-file', {targets: [target1, target2]})
      .then(results => assert.equal(readSingle(results), expectedFinalContent));
  });

  it('handles cascading path transforms', () => {
    const expectedIntermediatePath = 'index.jsp';
    const expectedFinalPath = 'index.php';
    const target1 = {
      pattern: 'index.html',
      rename: () => expectedIntermediatePath
    };
    const target2 = {
      pattern: 'index.html',
      rename(path_) {
        assert.equal(path_, expectedIntermediatePath);
        return expectedFinalPath;
      }
    };
    return build('fixtures/single-file', {targets: [target1, target2]})
      .then(results => assert.deepEqual(results.files, [expectedFinalPath]));
  });

  it('handles multiple files', () => {
    const expectedContent = 'I could use a little fuel myself and we could all use a little change';
    const expectedFiles = ['index.css', 'index.html', 'index.js'];
    const target = {
      pattern: '*',
      transform: () => expectedContent
    };
    return build('fixtures/multiple-files', {targets: [target]})
      .then(results => {
        assert.deepEqual(results.files, expectedFiles);
        assert.deepEqual(readMultiple(results), [expectedContent, expectedContent, expectedContent]);
      });
  });

  it('handles similarly-named files', () => {
    const expectedContent = 'I could use a little fuel myself and we could all use a little change';
    const expectedIgnoredFileContent = '<body>Unchanged</body>\n';
    const expectedFiles = ['elsewhere/', 'elsewhere/index.html', 'index.html'];
    const target = {
      pattern: 'index.html',
      transform: () => expectedContent
    };
    return build('fixtures/similarly-named-files', {targets: [target]})
      .then(results => {
        assert.deepEqual(results.files, expectedFiles);
        assert.deepEqual(readMultiple(results), [expectedIgnoredFileContent, expectedContent]);
      });
  });

  it('ignores untargeted files', () => {
    const expectedCSS = '.unchanged {}\n';
    const expectedHTML = 'I could use a little fuel myself and we could all use a little change';
    const expectedJS = 'I watched you change into a fly';
    const expectedFiles = ['index.css', 'index.html', 'index.js'];
    const target1 = {
      pattern: 'index.html',
      transform: () => expectedHTML
    };
    const target2 = {
      pattern: 'index.js',
      transform: () => expectedJS
    };
    return build('fixtures/multiple-files', {targets: [target1, target2]})
      .then(results => {
        assert.deepEqual(results.files, expectedFiles);
        assert.deepEqual(readMultiple(results), [expectedCSS, expectedHTML, expectedJS]);
      });
  });
});

function readSingle(results) {
  const files = filterOnlyFiles(results);
  assert.equal(files.length, 1, 'Should be exactly one file');
  return readMultiple(results).pop();
}

function readMultiple(results) {
  const files = filterOnlyFiles(results).sort();  // Deterministic please
  assert(files.length, 'Should be at least one file');
  return files.map(filename => {
    const filepath = path.join(results.directory, filename);
    return fs.readFileSync(filepath).toString('utf-8');
  });
}

function filterOnlyFiles(results) {
  return results.files.filter(str => !/\/$/.test(str));
}
