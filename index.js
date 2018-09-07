'use strict';

/**
 * Load openST Platform module
 */

const InstanceComposer = require('./instance_composer');
const version = require('./package.json').version;

require('./providers/ChainWeb3');
require('./lib/Signers');
require('./lib/Setup');
require('./lib/Contracts');
require('./lib/TokenEconomy');

const OpenST = function(gethEndPoint, configStrategy) {
  const oThis = this;

  oThis.version = version;

  oThis.configurations = Object.assign({ gethEndPoint: gethEndPoint }, configStrategy);

  const _instanceComposer = new InstanceComposer(oThis.configurations);

  oThis.ic = function() {
    return _instanceComposer;
  };

  let _web3 = oThis.ic().chainWeb3();
  oThis.web3 = function() {
    return _web3;
  };

  oThis.contracts = oThis.ic().Contracts();

  oThis.setup = oThis.ic().Setup();

  oThis.signers = oThis.ic().Signers();

  oThis.utils = OpenST.utils;

  oThis.TokenEconomy = oThis.ic().TokenEconomy();
};

OpenST.prototype = {
  constructor: OpenST,
  configurations: null
};

OpenST.utils = {
  GethSignerService: require('./utils/GethSignerService'),
  ExecutableTransaction: require('./utils/ExecutableTransaction')
};

module.exports = OpenST;
