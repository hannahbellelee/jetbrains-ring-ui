define(['global/global', 'chai', 'diff/diff'], function(ring, chai) {
  'use strict';

  var expect = chai.expect;

  describe('DiffTool basics: loading, getting and creating ' +
      'instance', function() {
    it('DiffTool loads as ring module', function() {
      expect(ring('diff')).to.be.a('function');
    });

    it('Module returns constructor of DiffTool properly.', function() {
      var DiffTool = ring('diff').invoke('getDiffTool');
      var instance = new DiffTool();

      expect(DiffTool).to.be.a('function');
      expect(instance).to.be.an.instanceof(DiffTool);
    });
  });

  describe('DiffTool constructor', function() {
    var DiffTool = ring('diff').invoke('getDiffTool');
    var diffToolInstance;

    it('DiffTool creates instance without parameters and ' +
        'set correct default values', function() {
      diffToolInstance = new DiffTool();
      // todo(igor.alexeenko): Find out, how to test an empty <div/> element.
      expect(diffToolInstance.element_.tagName).to.equal('DIV');
      expect(diffToolInstance.mode_).to.equal(DiffTool.Mode.SINGLE_PANE);
    });

    it('DiffTool creates instance with all possible parameters — ' +
        'editable, element and default mode', function() {
      var element = document.createElement('div');

      diffToolInstance = new DiffTool(element, DiffTool.Mode.DOUBLE_PANE);
      expect(diffToolInstance.element_).to.equal(element);
      expect(diffToolInstance.mode_).to.equal(DiffTool.Mode.DOUBLE_PANE);
    });

    it('DiffTool normalizes given parameters and replace them to ' +
        'default values if they are not correct', function() {
      diffToolInstance = new DiffTool(undefined, DiffTool.Mode.ALL);
      expect(diffToolInstance.element_.tagName).to.equal('DIV');
      expect(diffToolInstance.mode_).to.equal(DiffTool.Mode.SINGLE_PANE);
    });

    it('DiffTool constructor adds all required fields', function() {
      diffToolInstance = new DiffTool();
      expect(diffToolInstance.mode_).to.be.a('number');
      expect(diffToolInstance.element_).to.be.an.instanceof(Element);
    });
  });

  describe('DiffTool modes', function() {
    var DiffTool = ring('diff').invoke('getDiffTool');
    var diffToolInstance = new DiffTool();

    describe('DiffTool modes existence', function() {
      it('DiffTool has enumerable list of modes.', function() {
        expect(DiffTool.Mode).to.be.an('object');
      });

      it('Every item of list DiffTool.Mode is a number and it bites ' +
          'does not intersect with bites of other items, so every ' +
          'item can be used as bit mask.', function() {
        // Following modes should be skipped, because it is aliases for
        // quick access to enable/disable all modes or check, whether all
        // of them enabled or disabled.
        var skipModes = {};
        skipModes[DiffTool.Mode.ALL] = true;
        skipModes[DiffTool.Mode.NONE] = true;

        var currentState = 0x00;
        var currentMode;

        for (var modeID in DiffTool.Mode) {
          currentMode = DiffTool.Mode[modeID];
          expect(currentMode).to.be.a('number');

          if (!(currentMode in skipModes)) {
            currentState = currentState & currentMode;
            expect(currentState).to.equal(0x00);
          }
        }
      });

      it('Every instance of DiffTool has a bit mask of available modes ' +
          'and those mods are taken from list of modes and was not ' +
          'randomly made up', function() {
        expect(DiffTool.prototype.availableModes).to.be.a('number');

        for (var modeID in DiffTool.Mode) {
          expect(Boolean(DiffTool.Mode[modeID] |
              DiffTool.prototype.availableModes)).to.be(true);
        }
      });
    });

    describe('DiffTool modes setters and getters', function() {
      it('DiffTool getMode returns current mode and default value is ' +
          'DiffTool.Mode.SINGLE_PANE', function() {
        expect(diffToolInstance.getMode()).to.equal(
            DiffTool.Mode.SINGLE_PANE);
      });

      describe('DiffTool setMode', function() {
        it('DiffTool sets valid mode, which is one ' +
            'of allowed modes', function() {
          diffToolInstance.setMode(DiffTool.Mode.DOUBLE_PANE);
          expect(diffToolInstance.getMode()).to.equal(
              DiffTool.Mode.DOUBLE_PANE);
        });

        it('DiffTool does not allow to set mode, which is not listed in ' +
            'list of available modes. It that case it does nothing with' +
            'current mode', function() {
          diffToolInstance.setMode(DiffTool.Mode.SINGLE_PANE);
          diffToolInstance.setMode(DiffTool.Mode.TRIPLE_PANE);
          expect(diffToolInstance.getMode()).to.equal(
              DiffTool.Mode.SINGLE_PANE);
        });
      });
    });
  });

  // todo(igor.alexeenko): tests for setModeInternal.
  // check lookup table of states to controllers. Check whether method takes
  // correct instance of controller in each case.

  // todo(igor.alexeenko): check, whether changes in DiffTool causes
  // changes of corresponding states in diffTool.EditorController and
  // all states syncs correctly.
});
