##### OpenST Signer Service
openst.js makes it easy for developers to build custom and secure key-management solutions.

Thats right! You can build your own custom signer service. Once the signer service is set, you can continue to use Contract.methods.myMethod.send (https://web3js.readthedocs.io/en/1.0/web3-eth-contract.html#methods-mymethod-send) & web3.eth.sendTransaction (https://web3js.readthedocs.io/en/1.0/web3-eth.html#sendtransaction) without worrying about unlocking/signing the transactions. You can set the signer service using `openST.signers.setSignerService` method.

OpenST.js will call your service to determine the nonce of the sender, ask your service to sign the transaction and then submit the transaction. 

All you need to do is provide the instance of openST with an object that exposes three functions:
```js

let signerServiceObject = {
  // nonce - method to provide nonce of the address.
  nonce: function ( address ) {
    return new Promise( function (resolve, reject) {
      //Your code here
      //...
      //...
      //...
      //resolve the promise with the nonce of the address
    });
  },

  // signTransaction - method to provide openSt with signed raw transaction.
  signTransaction: function (txObj, address) {
    // txObj - web3 transaction object.
    // address - address which needs to sign the transaction.

    return new Promise( function (resolve, reject) {
      // Your code here
      // ...
      // ...
      // ...
      // resolve the promise with the signed txObj that confirms to web3 standards: 
      // https://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#id5
      //
      // OR
      //
      // resolve the promise with signed rawTransaction (String).
    });
  },
  // sign - method to sign raw data.
  sign: function (dataToSign, address) {
    //dataToSign - raw data to sign.
    //address - address that needs to sign the transaction.
    return new Promise( function (resolve, reject) {
      // Your code here
      // ...
      // ...
      // ...

      // resolve the promise with the signed data.
    });
  }
};
```

openst.js comes with a sample geth signer service that you can use for development purpose.

```js
let gethSigner = new openST.utils.GethSignerService(openST.web3());

gethSigner.addAccount(deployerAddress, passphrase);
gethSigner.addAccount(organizationAddress, passphrase);
gethSigner.addAccount(wallet1, passphrase);
gethSigner.addAccount(wallet2, passphrase);
gethSigner.addAccount(ephemeralKey, passphrase);
gethSigner.addAccount(facilitatorAddress, passphrase);

openST.signers.setSignerService(gethSigner);
```