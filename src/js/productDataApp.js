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
    
    // ✅ NEW: Seller login function
    loginSeller: function() {
        var sellerCode = document.getElementById('sellerLoginCode').value.trim();
        
        if(!sellerCode) {
            alert('Please enter your seller code');
            return;
        }
        
        // Store seller code
        localStorage.setItem('currentSellerCode', sellerCode);
        sessionStorage.setItem('currentSellerCode', sellerCode);
        
        // Show inventory section, hide login section
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('inventorySection').style.display = 'block';
        document.getElementById('sellerCode').value = sellerCode;
        
        alert('Login successful! Seller code: ' + sellerCode);
    },
    
    // ✅ NEW: Seller logout function
    clearSellerLogin: function() {
        localStorage.removeItem('currentSellerCode');
        sessionStorage.removeItem('currentSellerCode');
        
        // Clear input fields
        document.getElementById('sellerLoginCode').value = '';
        document.getElementById('sellerCode').value = '';
        document.getElementById('logdata').innerHTML = '';
        
        // Show login section, hide inventory section
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('inventorySection').style.display = 'none';
    },

    getData:function(event) {
        event.preventDefault();
        
        // ✅ GET SELLER CODE FROM STORAGE (NOT FROM USER INPUT)
        var currentSellerCode = localStorage.getItem('currentSellerCode') || sessionStorage.getItem('currentSellerCode');
        
        if(!currentSellerCode) {
            alert('Error: You must enter your seller code first. Please login above.');
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
                // ✅ ALWAYS USE STORED SELLER CODE (verified by smart contract)
                return productInstance.queryProductsList(web3.fromAscii(currentSellerCode),{from:account});

            }).then(function(result){
                
                console.log('Query result:', result); // ✅ DEBUG: Log results
                
                var productIds=[];
                var productSNs=[];
                var productNames=[];
                var productBrands=[];
                var productPrices=[];
                var productStatus=[];

                // Extract arrays from result
                for(var k=0;k<result[0].length;k++){
                    productIds[k]=result[0][k];
                }

                for(var k=0;k<result[1].length;k++){
                    productSNs[k]=web3.toAscii(result[1][k]);
                }

                for(var k=0;k<result[2].length;k++){
                    productNames[k]=web3.toAscii(result[2][k]);
                }

                for(var k=0;k<result[3].length;k++){
                    productBrands[k]=web3.toAscii(result[3][k]);
                }

                for(var k=0;k<result[4].length;k++){
                    productPrices[k]=result[4][k];
                }

                for(var k=0;k<result[5].length;k++){
                    productStatus[k]=web3.toAscii(result[5][k]);
                }

                // Build table rows
                var t = "";
                document.getElementById('logdata').innerHTML = t;
                
                // ✅ IMPROVED: Show all products (don't break on price=0)
                var rowCount = 0;
                for(var i=0;i<result[0].length;i++) {
                    // Skip empty entries (where both ID and price are 0)
                    if(productIds[i] == 0 && productPrices[i] == 0) {
                        continue;
                    }
                    
                    var tr="<tr>";
                    tr+="<td>"+productIds[i]+"</td>";
                    tr+="<td>"+productSNs[i]+"</td>";
                    tr+="<td>"+productNames[i]+"</td>";
                    tr+="<td>"+productBrands[i]+"</td>";
                    tr+="<td>"+productPrices[i]+"</td>";
                    tr+="<td>"+productStatus[i]+"</td>";
                    tr+="</tr>";
                    t+=tr;
                    rowCount++;
                }
                
                // Add rows to table
                if(rowCount > 0) {
                    document.getElementById('logdata').innerHTML = t;
                    console.log('✅ Displayed ' + rowCount + ' products'); // ✅ DEBUG
                } else {
                    document.getElementById('logdata').innerHTML = '<tr><td colspan="6" style="text-align:center; color: #999;">No products found for your seller code.</td></tr>';
                    console.log('⚠️ No products found'); // ✅ DEBUG
                }
                
                document.getElementById('add').innerHTML=account;
           }).catch(function(err){
               // ✅ HANDLE ACCESS CONTROL ERRORS
               console.error('Error fetching products:', err); // ✅ DEBUG
               if(err.message.includes('Only seller owner')) {
                   alert('Access Denied: Invalid seller code or you do not own these products.');
               } else if(err.message.includes('only') || err.message.includes('Error')) {
                   alert('Access Error: ' + err.message);
               } else {
                   console.log(err.message);
               }
           })
        })
    }
};

// ✅ CHECK LOGIN STATUS ON PAGE LOAD
window.addEventListener('load', function() {
    var currentSellerCode = localStorage.getItem('currentSellerCode') || sessionStorage.getItem('currentSellerCode');
    if(currentSellerCode) {
        // Already logged in - show inventory view
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('inventorySection').style.display = 'block';
        document.getElementById('sellerCode').value = currentSellerCode;
    } else {
        // Not logged in - show login form
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('inventorySection').style.display = 'none';
    }
    
    App.init();
});