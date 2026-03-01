# Security Fixes: Prevent Unauthorized Seller Data Access

## QUICK ANSWER: YES, implement Option B (Recommended)
Combines smart contract access control + frontend validation.

---

## OPTION A: Frontend-Only Quick Fix
**Pros:** Easy, fast | **Cons:** Not truly secure, can be bypassed

### Step 1: Store seller code on login
```javascript
// After seller logs in, store their seller code
sessionStorage.setItem('currentSellerCode', sellerCode);
```

### Step 2: Validate before allowing queries
```javascript
function canAccessSellerData(requestedSellerCode) {
    const currentSellerCode = sessionStorage.getItem('currentSellerCode');
    return currentSellerCode === requestedSellerCode;
}
```

### Step 3: Update queryProducts.html
```html
<input type="text" class="form-control" id="sellerCode" 
       placeholder="Your Seller Code" name="sellerCode" 
       readonly value="">
<!-- Make it readonly and pre-fill with current seller's code -->
```

**Issue:** A hacker can modify sessionStorage in console!

---

## OPTION B: Smart Contract Access Control (RECOMMENDED)
**Pros:** Truly secure, blockchain-verified | **Cons:** Requires contract update & redeploy

### Problem:
Currently no way to verify WHO is calling the function:
```solidity
function queryProductsList(bytes32 _sellerCode) public view returns(...){
    // Who is calling this? We don't know!
}
```

### Solution: Add seller mapping to contract owner

#### Step 1: Update Smart Contract
```solidity
pragma solidity ^0.8.12;

contract product {

    uint256 sellerCount;
    uint256 productCount;

    // ADD THIS: Map seller codes to their owner addresses
    mapping(bytes32 => address) sellerOwners;

    // ✅ UPDATED: Track seller-to-manufacturer relationship
    mapping(bytes32 => bytes32) sellerToManufacturer;

    struct seller{
        uint256 sellerId;
        bytes32 sellerName;
        bytes32 sellerBrand;
        bytes32 sellerCode;
        uint256 sellerNum;
        bytes32 sellerManager;
        bytes32 sellerAddress;
    }
    mapping(uint=>seller) public sellers;

    // ... other structs ...

    // ✅ MODIFIED: Updated addSeller to track seller owner
    function addSeller(bytes32 _manufacturerId, bytes32 _sellerName, bytes32 _sellerBrand, 
                       bytes32 _sellerCode, uint256 _sellerNum, bytes32 _sellerManager, 
                       bytes32 _sellerAddress) public {
        sellers[sellerCount] = seller(sellerCount, _sellerName, _sellerBrand, _sellerCode,
                                       _sellerNum, _sellerManager, _sellerAddress);
        
        // IMPORTANT: Record who created this seller
        sellerOwners[_sellerCode] = msg.sender;
        sellerToManufacturer[_sellerCode] = _manufacturerId;
        
        sellerCount++;
        sellersWithManufacturer[_manufacturerId].push(_sellerCode);
    }

    // ✅ NEW: Add access control modifier
    modifier onlySellerOwner(bytes32 _sellerCode) {
        require(sellerOwners[_sellerCode] == msg.sender, 
                "Only seller owner can access this data");
        _;
    }

    // ✅ UPDATED: Add access control
    function queryProductsList(bytes32 _sellerCode) 
        public view 
        onlySellerOwner(_sellerCode)  // ADD THIS
        returns(uint256[] memory, bytes32[] memory, bytes32[] memory, 
                bytes32[] memory, uint256[] memory, bytes32[] memory){
        
        bytes32[] memory productSNs = productsWithSeller[_sellerCode];
        uint256 k=0;

        uint256[] memory pids = new uint256[](productCount);
        bytes32[] memory pSNs = new bytes32[](productCount);
        bytes32[] memory pnames = new bytes32[](productCount);
        bytes32[] memory pbrands = new bytes32[](productCount);
        uint256[] memory pprices = new uint256[](productCount);
        bytes32[] memory pstatus = new bytes32[](productCount);

        for(uint i=0; i<productCount; i++){
            for(uint j=0; j<productSNs.length; j++){
                if(productItems[i].productSN==productSNs[j]){
                    pids[k] = productItems[i].productId;
                    pSNs[k] = productItems[i].productSN;
                    pnames[k] = productItems[i].productName;
                    pbrands[k] = productItems[i].productBrand;
                    pprices[k] = productItems[i].productPrice;
                    pstatus[k] = productItems[i].productStatus;
                    k++;
                }
            }
        }
        return(pids, pSNs, pnames, pbrands, pprices, pstatus);
    }

    // ✅ NEW: Verify seller ownership
    function getSellerOwner(bytes32 _sellerCode) public view returns(address) {
        return sellerOwners[_sellerCode];
    }

    // ✅ UPDATED: Add access control to manufacturerSellProduct
    function manufacturerSellProduct(bytes32 _productSN, bytes32 _sellerCode) 
        public 
        require(msg.sender == productsManufactured[_productSN], "Only product manufacturer can sell")
    {
        productsWithSeller[_sellerCode].push(_productSN);
        productsForSale[_productSN] = _sellerCode;
    }

    // ... rest of contract ...
}
```

#### Step 2: Redeploy Contract
```bash
truffle migrate --reset
```

#### Step 3: Update Frontend JavaScript
```javascript
// In sellerApp.js - when seller logs in
App.registerProduct = function(event) {
    event.preventDefault();
    var productInstance;
    var sellerCode = document.getElementById('SellerCode').value;
    
    web3.eth.getAccounts(function(error, accounts){
        if(error) console.log(error);
        
        var account = accounts[0];
        
        // Store seller's wallet address and code
        localStorage.setItem('currentSellerCode', sellerCode);
        localStorage.setItem('currentSellerAddress', account);
        
        App.contracts.product.deployed().then(function(instance){
            productInstance = instance;
            // Contract will verify msg.sender = sellerOwners[sellerCode]
            return productInstance.addSeller(
                web3.fromAscii(ManufacturerId),
                web3.fromAscii(sellerName),
                web3.fromAscii(sellerBrand),
                web3.fromAscii(sellerCode),
                sellerPhoneNumber,
                web3.fromAscii(sellerManager),
                web3.fromAscii(sellerAddress),
                {from: account}
            );
        }).then(function(result){
            alert('Seller registered successfully!');
            window.location.href = 'seller.html';
        }).catch(function(err){
            // Contract will throw error if not authorized
            alert('Error: ' + err.message);
        });
    });
};

// In sellerDataApp.js - when querying products
App.getData = function(event) {
    event.preventDefault();
    
    // Get the current seller code from storage
    const currentSellerCode = localStorage.getItem('currentSellerCode');
    
    if(!currentSellerCode) {
        alert('Please login first');
        return;
    }
    
    var productInstance;
    web3.eth.getAccounts(function(error, accounts){
        if(error) console.log(error);
        
        var account = accounts[0];
        
        App.contracts.product.deployed().then(function(instance){
            productInstance = instance;
            
            // IMPORTANT: Always use currentSellerCode from storage
            // User can't input a different seller code
            return productInstance.queryProductsList(
                web3.fromAscii(currentSellerCode),
                {from: account}
            );
        }).then(function(result){
            // Display results...
        }).catch(function(err){
            // If not owner, contract will reject with error
            if(err.message.includes('Only seller owner')) {
                alert('Access Denied: You can only access your own seller data');
            } else {
                alert('Error: ' + err.message);
            }
        });
    });
};
```

---

## OPTION C: Full Authentication System
**Pros:** Enterprise-grade security | **Cons:** Complex, requires backend API

### Would require:
1. Backend API for user management
2. JWT/OAuth authentication
3. User database
4. Session management
5. Audit logging
6. Role-based access control (RBAC)
7. Rate limiting
8. Encryption

**Only implement if this is production application**

---

## COMPARISON TABLE

| Feature | Option A | Option B | Option C |
|---------|----------|----------|----------|
| **Speed to implement** | 1 hour | 3 hours | 1 week+ |
| **Security level** | Low ⚠️ | High ✅ | Enterprise ✅✅ |
| **Blockchain verified** | No | Yes | Yes |
| **Bypassable** | Yes (JS console) | No | No |
| **Recommended** | Demo only | **YES** | Production |

---

## MY RECOMMENDATION: Use Option B

**Why?**
1. ✅ Truly secure - blockchain enforced
2. ✅ Reasonable implementation time
3. ✅ Immutable access control
4. ✅ Follows blockchain best practices
5. ✅ No backend API needed

---

## IMPLEMENTATION CHECKLIST

- [ ] Backup current smart contract
- [ ] Create new smart contract with access control
- [ ] Test contract locally in Truffle
- [ ] Update frontend JavaScript
- [ ] Test seller login flow
- [ ] Test unauthorized access (should fail)
- [ ] Redeploy to blockchain
- [ ] Update product.json ABI
- [ ] Test all affected pages
- [ ] Document the security model

---

## TEST: Verify Security Works

```javascript
// Should FAIL - not the owner
seller_b_address.queryProductsList("SELLER_A_CODE")
// Expected error: "Only seller owner can access this data"

// Should SUCCEED - is the owner
seller_a_address.queryProductsList("SELLER_A_CODE")
// Expected: Returns seller A's products
```

---

## FILES TO MODIFY

### Backend:
- `contracts/product.sol` - Add modifiers, mapping, access control

### Frontend:
- `src/js/sellerApp.js` - Store seller info on login
- `src/js/sellerDataApp.js` - Use stored seller code
- `src/queryProducts.html` - Remove form input for seller code
- `src/addSeller.html` - Login form to capture seller
- All other query pages - Apply same pattern

---

## Questions to Consider

1. Should consumers also be restricted to their own purchase history? **YES**
2. Should manufacturers only see their own products? **YES**
3. Should there be an audit log? **YES (future)**
4. Who is the "super admin" who can see everything? **Needs to be defined**

Would you like me to implement Option B for you?
