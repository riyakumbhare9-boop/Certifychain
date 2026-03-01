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

        var productSN = document.getElementById('productSN').value;
        var sellerCode = document.getElementById('sellerCode').value;
        // ✅ GET MANUFACTURER ID (stored when product was added)
        var manufacturerId = localStorage.getItem('currentManufacturerID') || sessionStorage.getItem('currentManufacturerID');
        
        if(!manufacturerId) {
            alert('Error: Please go to "Add Product" first to establish your manufacturer ID');
            return;
        }
 
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
                // ✅ PASS MANUFACTURER ID TO AUTO-REGISTER SELLER
                return productInstance.manufacturerSellProduct(web3.fromAscii(productSN), web3.fromAscii(sellerCode), web3.fromAscii(manufacturerId), {from:account});
             }).then(function(result){
                // console.log(result);
                alert('Product sold to seller successfully! Seller auto-registered.');
                window.location.reload();
                document.getElementById('sellerName').innerHTML='';
                document.getElementById('sellerBrand').innerHTML='';

            }).catch(function(err){
                console.log(err.message);
                alert('Error: ' + err.message);
            });
        });
    }
};

$(function() {

    $(window).load(function() {
        App.init();
    })
})