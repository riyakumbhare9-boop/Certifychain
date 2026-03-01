App = {
    web3Provider: null,
    contracts: {},

    init: async function() {
        return await App.initWeb3();
    },

    initWeb3: function() {
        if(window.web3) {
            App.web3Provider=window.web3.currentProvider;
        } else {
            App.web3Provider=new Web3.proviers.HttpProvider('http://localhost:7545');
        }

        web3 = new Web3(App.web3Provider);
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

        $(document).on('click','.btn-register',App.getData);
    },

    getData:function(event) {
        event.preventDefault();
        
        // ✅ GET MANUFACTURER ID FROM STORAGE (NOT FROM USER INPUT)
        var currentManufacturerID = localStorage.getItem('currentManufacturerID') || sessionStorage.getItem('currentManufacturerID');
        
        if(!currentManufacturerID) {
            alert('Error: You must add a product first to establish your manufacturer ID. Please go to Add Product page.');
            return;
        }

        var productInstance;
        //window.ethereum.enable();
        web3.eth.getAccounts(function(error,accounts){

            if(error) {
                console.log(error);
            }

            var account=accounts[0];
            // console.log(account);

            App.contracts.product.deployed().then(function(instance){

                productInstance=instance;
                // ✅ ALWAYS USE STORED MANUFACTURER ID (verified by smart contract)
                return productInstance.querySellersList(web3.fromAscii(currentManufacturerID),{from:account});

            }).then(function(result){
                
                console.log('Query result:', result); // ✅ DEBUG: Log results
                
                var sellerId=[];
                var sellerName=[];
                var sellerBrand=[];
                var sellerCode=[];
                var sellerNum=[];
                var sellerManager=[];
                var sellerAddress=[];
                
                // Extract arrays from result
                for(var k=0;k<result[0].length;k++){
                    sellerId[k]=result[0][k];
                }

                for(var k=0;k<result[1].length;k++){
                    sellerName[k]=web3.toAscii(result[1][k]);
                }

                for(var k=0;k<result[2].length;k++){
                    sellerBrand[k]=web3.toAscii(result[2][k]);
                }

                for(var k=0;k<result[3].length;k++){
                    sellerCode[k]=web3.toAscii(result[3][k]);
                }

                for(var k=0;k<result[4].length;k++){
                    sellerNum[k]=result[4][k];
                }

                for(var k=0;k<result[5].length;k++){
                    sellerManager[k]=web3.toAscii(result[5][k]);
                }

                for(var k=0;k<result[6].length;k++){
                    sellerAddress[k]=web3.toAscii(result[6][k]);
                }

                // Build table rows
                var t= "";
                document.getElementById('logdata').innerHTML = t;
                
                // ✅ IMPROVED: Show all sellers (don't break on count=0)
                var rowCount = 0;
                for(var i=0;i<result[0].length;i++) {
                    // Skip empty entries (where both ID and count are 0)
                    if(sellerId[i] == 0 && sellerNum[i] == 0) {
                        continue;
                    }
                    
                    var tr="<tr>";
                    tr+="<td>"+sellerId[i]+"</td>";
                    tr+="<td>"+sellerName[i]+"</td>";
                    tr+="<td>"+sellerBrand[i]+"</td>";
                    tr+="<td>"+sellerCode[i]+"</td>";
                    tr+="<td>"+sellerNum[i]+"</td>";
                    tr+="<td>"+sellerManager[i]+"</td>";
                    tr+="<td>"+sellerAddress[i]+"</td>";
                    tr+="</tr>";
                    t+=tr;
                    rowCount++;
                }
                
                // Add rows to table
                if(rowCount > 0) {
                    document.getElementById('logdata').innerHTML = t;
                    console.log('✅ Displayed ' + rowCount + ' sellers'); // ✅ DEBUG
                } else {
                    document.getElementById('logdata').innerHTML = '<tr><td colspan="7" style="text-align:center; color: #999;">No sellers found for your manufacturer ID.</td></tr>';
                    console.log('⚠️ No sellers found'); // ✅ DEBUG
                }
                
                document.getElementById('add').innerHTML=account;
           }).catch(function(err){
               // ✅ HANDLE ACCESS CONTROL ERRORS
               console.error('Error fetching sellers:', err); // ✅ DEBUG
               if(err.message.includes('Only manufacturer owner')) {
                   alert('Access Denied: You can only access your own sellers. Unauthorized access attempt logged.');
               } else if(err.message.includes('only') || err.message.includes('Error')) {
                   alert('Access Error: ' + err.message);
               } else {
                   console.log(err.message);
               }
           })
        })
    },

    // ✅ MANUFACTURER LOGIN - Store ID and show seller view
    loginManufacturer: function() {
        var manufacturerCode = document.getElementById('manufacturerLoginCode').value.trim();
        if(!manufacturerCode) {
            alert('Please enter your manufacturer ID');
            return;
        }
        localStorage.setItem('currentManufacturerID', manufacturerCode);
        sessionStorage.setItem('currentManufacturerID', manufacturerCode);
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('sellerViewSection').style.display = 'block';
        document.getElementById('manufacturerCode').value = manufacturerCode;
        App.getData({preventDefault: function(){}});
    },

    // ✅ MANUFACTURER LOGOUT - Clear ID and return to login form
    clearManufacturerLogin: function() {
        localStorage.removeItem('currentManufacturerID');
        sessionStorage.removeItem('currentManufacturerID');
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('sellerViewSection').style.display = 'none';
        document.getElementById('manufacturerLoginCode').value = '';
    }
};

// ✅ PAGE LOAD HANDLER - Show appropriate section based on login state
window.addEventListener('load', function() {
    var currentManufacturerID = localStorage.getItem('currentManufacturerID') || sessionStorage.getItem('currentManufacturerID');
    if(currentManufacturerID) {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('sellerViewSection').style.display = 'block';
        document.getElementById('manufacturerCode').value = currentManufacturerID;
    } else {
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('sellerViewSection').style.display = 'none';
    }
    App.init();
});