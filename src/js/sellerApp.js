App = {

    web3Provider: null,
    contracts: {},

    init: async function() {
        return await App.initWeb3();
    },

    initWeb3: async function() {
    if (window.ethereum) {
        App.web3Provider = window.ethereum;
        web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
    } 
    else if (window.web3) {
        App.web3Provider = window.web3.currentProvider;
        web3 = new Web3(window.web3.currentProvider);
    } 
    else {
        alert("Please install MetaMask!");
        return;
    }

    return App.initContract();
},

    initContract: function() {

        $.getJSON('product.json',function(data){

            var productArtifact=data;
            App.contracts.product=TruffleContract(productArtifact);
            App.contracts.product.setProvider(App.web3Provider);
        });

        return App.bindEvents();
    },

    bindEvents: function() {

        $(document).on('click','.btn-register',App.registerProduct);
    },

    registerProduct: function(event) {
        event.preventDefault();

        var productInstance;

        var sellerName = document.getElementById('SellerName').value;
        var sellerBrand = document.getElementById('SellerBrand').value;
        var sellerCode = document.getElementById('SellerCode').value;
        var sellerPhoneNumber = document.getElementById('SellerPhoneNumber').value;
        var sellerManager = document.getElementById('SellerManager').value;
        var sellerAddress = document.getElementById('SellerAddress').value;
        var ManufacturerId = document.getElementById('ManufacturerId').value;
       
        
        //window.ethereum.enable();
        web3.eth.getAccounts(function(error,accounts){

            if(error) {
                console.log(error);
            }

            console.log(accounts);
            var account=accounts[0];
            // console.log(account);

            App.contracts.product.deployed().then(function(instance){
                productInstance=instance;
                return productInstance.addSeller(web3.fromAscii(ManufacturerId),web3.fromAscii(sellerName),web3.fromAscii(sellerBrand), web3.fromAscii(sellerCode), sellerPhoneNumber, web3.fromAscii(sellerManager), web3.fromAscii(sellerAddress), {from:account});
             }).then(function(result){
                console.log(result);
                
                // ✅ STORE SELLER CODE AND ADDRESS FOR THIS SESSION
                localStorage.setItem('currentSellerCode', sellerCode);
                localStorage.setItem('currentSellerAddress', account);
                sessionStorage.setItem('currentSellerCode', sellerCode);
                
                alert('Seller registered successfully! Your code is: ' + sellerCode);
                window.location.href = 'seller.html';

            }).catch(function(err){
                alert('Error: Only the manufacturer can add sellers. ' + err.message);
                console.log(err.message);
            });
        });
    }
};

$(function() {

    $(window).load(function() {
        App.init();
    })
})