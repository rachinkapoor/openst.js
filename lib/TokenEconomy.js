'use strict';

const InstanceComposer = require('../instance_composer');
const EventEmitter3 = require('eventemitter3');

require('../lib/contract_interacts/ERC20Token');
require('../lib/contract_interacts/TokenRules');
require('../lib/contract_interacts/TokenHolder');

require('../lib/setup/InitERC20Token.js');
require('../lib/setup/InitTokenHolder.js');
require('../lib/setup/InitTokenRules.js');
require('../lib/setup/InitTransferRule.js');

const TokenEconomy = function(tokenRulesAddress, ERC20TokenAddress) {
  const oThis = this;
  oThis._is_ready_fired = false;

  if (!tokenRulesAddress) {
    let err = new Error("mandetory parameter 'tokenRulesAddress' (TokenRules Contract Address) is missing ");
    throw err;
  }

  //Derive from EventEmitter3 so that we can trigger 'ready' event on oThis.
  //This is needed because ERC20TokenAddress is optional.
  EventEmitter3.apply(oThis);

  // Set token rules.
  oThis._setTokenRules(tokenRulesAddress);

  // Set ERC20 Token
  if (ERC20TokenAddress) {
    oThis._setToken(ERC20TokenAddress);
  } else {
    oThis.tokenRules
      .token()
      .call()
      .then(function(tokenAddress) {
        oThis._setToken(tokenAddress);
        oThis._checkIfReady();
      })
      .catch(function(reason) {
        //Emit Error.
        oThis.emit('error', reason);
      });
  }

  //Expose TokenHolder
};

TokenEconomy.prototype = {
  tokenRules: null,
  token: null,
  isReady: function() {
    const oThis = this;
    return oThis.tokenRules && oThis.token;
  },
  tokenAddress: function() {
    const oThis = this;
    return oThis._ERC20TokenAddress;
  },
  tokenRulesAddress: function() {
    const oThis = this;
    return oThis._tokenRulesAddress;
  },
  tokenHolder: function(contractAddress) {
    const oThis = this;

    contractAddress = oThis.toChecksumAddress(contractAddress);
    console.log('contractAddress', contractAddress);
    let _tokenHolders = (oThis._tokenHolders = oThis._tokenHolders || {});

    if (_tokenHolders.hasOwnProperty(contractAddress)) {
      console.log('_tokenHolders[ contractAddress ]', _tokenHolders[contractAddress]);
      return _tokenHolders[contractAddress];
    }

    //Create an instance of TokenHolder.
    let TokenHolder = oThis.ic().TokenHolder();

    let thisTokenHolder = new TokenHolder(contractAddress);
    console.log('thisTokenHolder', thisTokenHolder);
    _tokenHolders[contractAddress] = thisTokenHolder;

    return thisTokenHolder;
  },
  toChecksumAddress: function(address) {
    const oThis = this;
    let _web3 = oThis.ic().chainWeb3();
    return _web3.utils.toChecksumAddress(address);
  },

  createTokenHolder: function() {
    const oThis = this;

    if (!oThis.isReady()) {
      let err = new Error('TokenEconomy is not yet ready to create TokenHolder.');
      return Promise.reject(err);
    }

    let args = Array.prototype.slice.call(arguments);
    let lastArg = args.pop();

    let options;
    if (typeof lastArg === 'string') {
      //Last arg is a wallet address.
      args.push(lastArg);
    } else if (typeof lastArg === 'object') {
      //Last arg is options.
      options = lastArg;
    }

    const minWalletRequirement = 1;
    if (args.length < minWalletRequirement) {
      //Insufficient wallet keys specified.
      let err = new Error('TokenHolder needs atleast ' + minWalletRequirement + ' or more wallet addresses.');
      return Promise.reject(err);
    }
    let wallets = args,
      len = wallets.length;
    while (len--) {
      wallets[len] = oThis.toChecksumAddress(wallets[len]);
    }

    let configStrategy = oThis.ic().configStrategy;
    options = Object.assign({}, configStrategy, options || {});

    if (!options.deployer) {
      console.log('configStrategy', configStrategy);
      console.log('options', options);
      let err = new Error('Please provide deployerAddress to createTokenHolder');
      return Promise.reject(err);
    }

    let requirement = options.requirement || minWalletRequirement;

    let InitTokenHolder = oThis.ic().InitTokenHolder();
    let serviceParams = {
      deployerAddress: options.deployer,
      gasPrice: options.gasPrice || '0x3B9ACA00',
      gasLimit: 4000000,
      args: [oThis.tokenAddress(), oThis.tokenAddress(), oThis.tokenRulesAddress(), requirement, wallets]
    };

    console.log('serviceParams', serviceParams);
    let service = new InitTokenHolder(serviceParams);

    return service.perform().then(function(response) {
      let contractAddress = response.receipt.contractAddress;
      return oThis.tokenHolder(contractAddress);
    });
  },

  // Internal method use.
  _tokenHolders: null,

  _tokenRulesAddress: null,
  _setTokenRules: function(contractAddress) {
    const oThis = this;

    contractAddress = oThis.toChecksumAddress(contractAddress);

    let TokenRules = oThis.ic().TokenRules();
    oThis.tokenRules = new TokenRules(contractAddress);
    oThis._tokenRulesAddress = contractAddress;
  },

  _ERC20TokenAddress: null,
  _setToken: function(contractAddress) {
    const oThis = this;

    contractAddress = oThis.toChecksumAddress(contractAddress);

    let ERC20Token = oThis.ic().ERC20Token();
    oThis.token = new ERC20Token(contractAddress);
    oThis._ERC20TokenAddress = contractAddress;
  },

  _is_ready_fired: false,
  _checkIfReady: function() {
    const oThis = this;

    if (oThis.isReady() && !oThis._is_ready_fired) {
      oThis.emit('ready');
      oThis._is_ready_fired = true;
    }
  }
};

//Derive prototype from EventEmitter3.
let finalProto = Object.create(EventEmitter3.prototype);
Object.assign(finalProto, TokenEconomy.prototype);
TokenEconomy.prototype = finalProto;

InstanceComposer.registerShadowableClass(TokenEconomy, 'TokenEconomy', true);
module.exports = TokenEconomy;
