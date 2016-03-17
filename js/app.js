app = angular.module('stockMng', ["firebase"]);
app.controller('appCtrl', ["$scope", "$firebaseObject","$firebaseAuth", function($scope,$firebaseObject,$firebaseAuth,$http) {
    var ref = new Firebase("https://dbstock.firebaseio.com/");
    $scope.user={};
    $scope.authObj = $firebaseAuth(ref);
    $scope.user.auth =function(){        
        $scope.authObj.$authWithPassword({
          email: $scope.user.email,
          password: $scope.user.password
      }).then(function(authData) {
           console.log("Logged in as:", authData.uid);
      }).catch(function(error) {
          console.error("Authentication failed:", error);
            $scope.user.error=error;
      });
    }
    
    ref.onAuth(function(authData) {
        if (authData) {
            $scope.user.authenticated =true;
            
            //load data
            var custObject = $firebaseObject(ref.child("customers"));
            var prodObject = $firebaseObject(ref.child("products"));
            var purchasesObject = $firebaseObject(ref.child("purchases"));
            var salesObject = $firebaseObject(ref.child("sales"));
            var suppObject = $firebaseObject(ref.child("suppliers"));
            var transObject = $firebaseObject(ref.child("transactions"));
            prodObject.$loaded(
                function(data) { 
                    //console.log(data === prodObject); // true
                });
            $scope.customers = custObject;
            $scope.products = prodObject;
            $scope.purchases = purchasesObject;
            $scope.sales = salesObject;
            $scope.suppliers = suppObject;
            $scope.transactions = transObject;


            console.log(authData.uid.email + " User " + authData.uid + " is logged in with " + authData.provider);
        } else {
            $scope.user.authenticated =false;
            console.log("User is logged out");
        }
    });  
    
    
    
    $scope.total={};
    $scope.getTotal = function(criteria,itemsList){
        var total=0;
        for(var i=0; i<itemsList.length;i++){
            if(criteria=="amount"){
                total= total+(itemsList[i].Quantity * itemsList[i].Price);
            }else if(criteria=="quantity"){
                total= total+itemsList[i].Quantity;
            }else if(criteria=="cost"){
                total= total+itemsList[i].Quantity* itemsList[i].Cost;
            }
        }
        return(total);
    }
    $scope.getCustomerSupplierName = function(Id){
        if(!Id || Id=="" || Id===undefined){
            return("");
        }else if($scope.customers[Id]){
            return($scope.customers[Id].Name);             
        }else if($scope.suppliers[Id]){
            return($scope.suppliers[Id].Name); 
        }else{
            return("");
        }
    }
    $scope.getSupplierName = function(Id){
        if(!Id || Id=="" || Id===undefined){
            return("");
        }else if($scope.suppliers[Id]){
            return($scope.suppliers[Id].Name);            
        }else{
            return("");
        }
    }
    $scope.getCustomerName = function(Id){
        if(!Id || Id=="" || Id===undefined){
            return("");
        }else if($scope.customers[Id]){
            return($scope.customers[Id].Name);             
        }else{
            return("");
        }
    }
    $scope.getProductName = function(prodId){
        if(prodId){
            return($scope.products[prodId].Name); 
        }
    }
    $scope.getProductPrice = function(prodId){
        if(prodId){
            return($scope.products[prodId].MRP);
        }
    }
    $scope.setFocus=function(id,$event){
        if ($event.keyCode=="13"){
                $('#' + id + '-quantity').focus();
            }      
    }
    $scope.mult=function(a,b){
        return parseInt(a)* parseInt(b);
    }
    $scope.getTotalCustSales =function(custId){
        var totalCustSales =0;
        angular.forEach($scope.sales, function(sale,key){
            if(sale.Customer==custId){
                var billAmount =sale.TotalAmount-sale.Discount;
                totalCustSales=totalCustSales+billAmount;
            }
        });
        return(totalCustSales);
    }
    //total paid per customer
    $scope.getTotalCustPaid=function(custId){
        var totalPaid =0;
        angular.forEach($scope.transactions,function(trans,key){
            if(trans.AccountId==custId){
                totalPaid=totalPaid+ trans.Received;
            }
        });
        return(totalPaid);
    }
    $scope.getBalanceCustCredit=function(custId,InitialCredit){
        return( InitialCredit+$scope.getTotalCustSales(custId) - $scope.getTotalCustPaid(custId));
    }
    //get total sales/ purchase
    $scope.getTotalSalesPurchase =function(criteria){
        var totalSalesPurchase=0; 
        angular.forEach($scope[criteria], function(item,key){
            totalSalesPurchase= totalSalesPurchase+(item.TotalAmount||0) - (item.Discount||0);
        });
        return(totalSalesPurchase);                        
    }
    //Total paid amount
    $scope.getTotalPaid =function(criteria){
        var totalPaid=0;
        angular.forEach($scope.transactions, function(trans,key){
            if (trans.Account==criteria){
                switch(criteria){
                    case "customers":
                        totalPaid=totalPaid+trans.Received;
                        break;
                    case "suppliers":   
                        totalPaid=totalPaid+trans.Given;
                        break;
                }                
            }
        });
        
        
        return(totalPaid);                        
    }
    $scope.getTotalBalanceCredit=function(criteria){
        var balanceCredit=0;
        var totalInitialCredit= 0;
        
        angular.forEach($scope[criteria],function(customer,key){
            totalInitialCredit=totalInitialCredit+customer.InitialCredit;
        });
        if(criteria=="customers"){
            balanceCredit=totalInitialCredit+ $scope.getTotalSalesPurchase("sales") - $scope.getTotalPaid(criteria);
        }else if (criteria=="suppliers"){
            balanceCredit=totalInitialCredit+ $scope.getTotalSalesPurchase("purchases") - $scope.getTotalPaid(criteria);
        }
        return(balanceCredit);
    }
    //get total purchase of each supplier
    $scope.getTotalSuppPurchases =function(suppId){
        var totalSuppPurchase =0;
        angular.forEach($scope.purchases, function(purchase,key){
            if(purchase.Supplier==suppId){
                var billAmount =purchase.TotalAmount - purchase.Discount;
                totalSuppPurchase=totalSuppPurchase+billAmount;
            }
        });
        return(totalSuppPurchase);
    }
    $scope.getTotalSuppPaid=function(suppId){
        var totalPaid =0;
        angular.forEach($scope.transactions,function(trans,key){
            if(trans.AccountId==suppId){
                totalPaid=totalPaid+ trans.Given;
            }
        });
        return(totalPaid);
    }    
    $scope.getBalanceSuppCredit=function(suppId,InitialCredit){
        return( InitialCredit+$scope.getTotalSuppPurchases(suppId) - $scope.getTotalSuppPaid(suppId));
    }
    $scope.getTotalStockValue=function(){
        var totalStockValue= 0;
        angular.forEach($scope.products,function(product,key){
            totalStockValue = totalStockValue+ product.Stock*product.Cost;
        });
        return(totalStockValue);
    }
}]);

app.controller('salesCtrl', ["$scope", "$firebaseObject" ,function($scope, $http){
    $scope.currentCust={};
    $scope.newSales= emptySale();
    $scope.newSales.Date=new Date();
    $scope.currentItem={"Stock": 0, "Error" : ""};
    //add sales item
    $scope.addNewSaleItem = function(addItem){
        var valid=true;
        if(addItem.Id==""|| addItem.Id===undefined){
            valid=false;
            $scope.currentItem.Error="id";
        }else if($scope.currentItem.Stock<addItem.Quantity || addItem.Quantity===undefined||addItem.Quantity==0){
            valid=false;
            if(addItem.Quantity==0){
                $scope.currentItem.Error="enterStock";
            }else{
                $scope.currentItem.Error="stock";
            }
            
            
        }
        var item = {"Id": addItem.Id,"MPR": addItem.MRP, "Quantity": addItem.Quantity, "Price": addItem.Price}
        if(valid==true){
            $scope.newSales.Items.push(item);
            $scope.addSalesItem.Id="";
            $scope.addSalesItem.MRP="";
            $scope.addSalesItem.Name="";
            $scope.addSalesItem.Price="";
            $scope.addSalesItem.Quantity="";              
            $scope.currentItem.Error="";
            $('#sale-id').focus();
            }
    }
    //remove item from new sale form
    $scope.removeItemNewSale = function(index){
        $scope.newSales.Items.splice(index, 1);
        $scope.addSalesItem.Id="";
    }  
    //on press enter on quantity
    $scope.setSalesEnter=function(addItem,$event){
        if ($event.keyCode=="13"){
                $scope.addNewSaleItem(addItem);
            }
    }
    $scope.addSalesItem={};
    $scope.setSalesItemDetails =function(itemId){
        if($scope.products[itemId]){
            $scope.addSalesItem.MRP=$scope.products[itemId].MRP;
            $scope.addSalesItem.Name=$scope.products[itemId].Name;
            $scope.addSalesItem.Price=$scope.addSalesItem.MRP;
            $scope.currentItem.Stock=$scope.products[itemId].Stock;
            angular.forEach($scope.newSales.Items,function(item,key){
                $scope.currentItem.Stock=$scope.currentItem.Stock-item.Quantity;
            });
            
        }else{
            $scope.addSalesItem.MRP="";
            $scope.addSalesItem.Name="";
            $scope.addSalesItem.Price="";
            $scope.addSalesItem.Quantity="";
            $scope.currentItem.Stock=0;
        }        
        
    }
    // save news sale to database
    $scope.addSale= function(newSaleData){
        if(newSaleData.Items.length==0){
            alert("Please add items");
        }else{
            $scope.sales.counter = ($scope.sales.counter||0) +1;
            var salesNum =$scope.sales.counter;
            salesNum =  "SL"+ pad(salesNum);
            newSaleData.Id = salesNum;
            //check if discount zero
            if (newSaleData.Discount==""){
                newSaleData.Discount=0;
            }
            newSaleData.TotalAmount= $scope.getTotal("amount",newSaleData.Items);
            for (var i=0; i<newSaleData.Items.length;i++){
                $scope.products[newSaleData.Items[i].Id].Stock=$scope.products[newSaleData.Items[i].Id].Stock- newSaleData.Items[i].Quantity; 
            } 
            var tempNewTransaction={"Id" :newSaleData.Id, "Date" :newSaleData.Date.getTime(),"AccountId": newSaleData.Customer,"Account": "customers","Particulars": "Sales","Given": 0,"Received": newSaleData.PaymentAmount,"PaymentMode": newSaleData.PaymentMethod};
            $scope.transactions[tempNewTransaction.Id]=tempNewTransaction;
            newSaleData.Date=newSaleData.Date.getTime();
            $scope.sales[salesNum]=newSaleData; 
            $scope.sales.$save().then(function(ref) { 
                $scope.newSales= emptySale();
                $scope.currentCust.Name="";
                $scope.submitted="";
                $scope.newSales.Date=new Date();
                alert("updated");
            }, function(error) {
                alert("Something Went wrong: " , error);
            });
            $scope.transactions.$save().then(function(ref) { 
                //alert("updated");
            }, function(error) {
                alert("Something Went wrong: " , error);
            }); //updated transaction
            $scope.products.$save().then(function(ref) { 
                //alert("updated");
            }, function(error) {
                alert("Something Went wrong: " , error);
            }); //update product
        //var dataToSend={"sales": $scope.sales, "purchases": $scope.purchases,"customers": $scope.customers, "products": $scope.products,"suppliers": $scope.suppliers,"transactions": $scope.transactions};
        /*var request = $http({
            method: "post",
            url: "update-json.php",
            data: dataToSend,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        request.success(function(data){
            $scope.newSales= emptySale();
            $scope.currentCust.Name="";
            $scope.submitted="";
            $scope.newSales.Date=new Date();
            alert(data);
        });*/
        }
    }
}]);


app.controller('purchasesCtrl', ["$scope", "$firebaseObject" ,function($scope, $http){
    $scope.currentSupp={};
    $scope.currentItem={};
    $scope.newPurchases= emptyPurchase();
    $scope.newPurchases.Date=new Date();
    //add purchases item
    $scope.addNewPurchaseItem = function(addItem){
        var valid=true;
        if(addItem.Id==""|| addItem.Id===undefined){
            valid=false;
            $scope.currentItem.Error="id";
        }else if(addItem.Quantity==0){
            valid=false;
            $scope.currentItem.Error="enterStock";
        }
        var item = {"Id": addItem.Id,"MPR": addItem.MRP, "Quantity": addItem.Quantity, "Cost": addItem.Cost}
        if(valid==true){
            $scope.newPurchases.Items.push(item);
            $scope.addPurchasesItem.Id="";
            $scope.addPurchasesItem.MRP="";
            $scope.addPurchasesItem.Name="";
            $scope.addPurchasesItem.Cost="";
            $scope.addPurchasesItem.Quantity="";  
            $('#purchase-id').focus();
            }
    }
    //remove item from new purchase form
    $scope.removeItemNewPurchase = function(index){
        $scope.newPurchases.Items.splice(index, 1); 
        $scope.addPurchasesItem.Id="";
    }  
    //on press enter on quantity
    $scope.setPurchasesEnter=function(addItem,$event){
        if ($event.keyCode=="13"){
                $scope.addNewPurchaseItem(addItem);
            }
    }
    $scope.addPurchasesItem={};
    $scope.setPurchasesItemDetails =function(itemId){
        if($scope.products[itemId]){
            $scope.addPurchasesItem.MRP=$scope.products[itemId].MRP;
            $scope.addPurchasesItem.Name=$scope.products[itemId].Name;
            $scope.addPurchasesItem.Cost=$scope.products[itemId].Cost;
        }else{
            $scope.addPurchasesItem.MRP="";
            $scope.addPurchasesItem.Name="";
            $scope.addPurchasesItem.Cost="";
            $scope.addPurchasesItem.Quantity="";            
        }        
        
    }
    // save new purchase to database
    $scope.addPurchase= function(newPurchaseData){
        if(newPurchaseData.Items.length==0){
            alert("Please add items");
        }else{
            $scope.purchases.counter = ($scope.purchases.counter||0) +1;
            var purchasesNum = $scope.purchases.counter;
        purchasesNum =  "PUR"+ pad(purchasesNum);
        newPurchaseData.Id = purchasesNum;
            //check if discount zero
            if (newPurchaseData.Discount==""){
                newPurchaseData.Discount=0;
            }
        newPurchaseData.TotalAmount= $scope.getTotal("cost",newPurchaseData.Items);
        var newPurchasesObj={};
            newPurchaseData.Date =newPurchaseData.Date.getTime();
        newPurchasesObj[purchasesNum] =  newPurchaseData ;
        
        for (var i=0; i<newPurchaseData.Items.length;i++){
            $scope.products[newPurchaseData.Items[i].Id].Stock=$scope.products[newPurchaseData.Items[i].Id].Stock+ newPurchaseData.Items[i].Quantity;            
        }
        
            $scope.purchases[purchasesNum]=newPurchaseData;            
            //newPurchaseData.Date =newPurchaseData.Date.getTime();
            var tempNewTransaction={"Id" :newPurchaseData.Id, "Date" :newPurchaseData.Date ,"AccountId": newPurchaseData.Supplier,"Account": "suppliers", "Particulars": "Purchases","Given": newPurchaseData.PaymentAmount,"Received": 0,"PaymentMode": newPurchaseData.PaymentMethod};
            $scope.transactions[tempNewTransaction.Id]=tempNewTransaction;
            $scope.purchases.$save().then(function(ref) {
                $scope.newPurchases= emptyPurchase();
                $scope.currentSupp.Name="";
                $scope.newPurchases.Date=new Date();
                alert("Updated");
            }, function(error) {
                alert("Something Went wrong: " , error);
            });
            $scope.transactions.$save().then(function(ref) { 
                //alert("updated");
            }, function(error) {
                alert("Something Went wrong: " , error);
            }); //updated transaction
            $scope.products.$save().then(function(ref) { 
                //alert("updated");
            }, function(error) {
                alert("Something Went wrong: " , error);
            });
            //save product
            
            /*var tempNewTransaction={"Id" :newPurchaseData.Id, "Date" :newPurchaseData.Date,"AccountId": newPurchaseData.Supplier,"Account": "suppliers", "Particulars": "Purchases","Given": newPurchaseData.PaymentAmount,"Received": "0","PaymentMode": newPurchaseData.PaymentMethod};
            $scope.transactions[tempNewTransaction.Id]=tempNewTransaction;
            var dataToSend={"sales": $scope.sales, "purchases": $scope.purchases,"customers": $scope.customers, "products": $scope.products,"suppliers": $scope.suppliers,"transactions": $scope.transactions};
            var request = $http({
                method: "post",
                url: "update-json.php",
                data: dataToSend,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            request.success(function(data){
                $scope.newPurchases= emptyPurchase();
                $scope.currentSupp.Name="";
                $scope.newPurchases.Date=new Date();
                alert(data);
            });*/
        }
    }
}]);

app.controller('productsCtrl', ["$scope", "$firebaseObject" , function($scope,$http){
    $scope.messageProdExist=false;
    $scope.newProduct={};
    $scope.addNewProduct = function(){
        var tempNewProduct={"Id": $scope.newProduct.Id, "Name": $scope.newProduct.Name, "Brand": $scope.newProduct.Brand, "MRP": $scope.newProduct.MRP, "Cost": $scope.newProduct.Cost,"Stock": $scope.newProduct.Stock,"InitialStock": $scope.newProduct.Stock};
        $scope.products[$scope.newProduct.Id]=tempNewProduct;
        //var dataToSend={"sales": $scope.sales, "purchases": $scope.purchases,"customers": $scope.customers, "products": $scope.products,"suppliers": $scope.suppliers,"transactions": $scope.transactions};
        //udpadeFireBase("products", tempNewProduct);
        $scope.products.$save().then(function(ref) {            
            $scope.newProduct={};
            alert("Updated");
        }, function(error) {
            alert("Something Went wrong: " , error);
        });
        
        /*var request = $http({
            method: "post",
            url: "update-json.php",
            data: dataToSend,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        request.success(function(data){
            $scope.newProduct={};
            alert(data);
        });*/
    }
    $scope.checkProduct=function(prodId){
        if($scope.products[prodId]){
            $scope.messageProdExist=true; 
        }
        else{
            $scope.messageProdExist=false;
        }
    }
    $scope.editProduct= function(prodId){
        $scope.messageProdExist=false;
        $scope.newProduct.Name=$scope.products[prodId].Name;
        $scope.newProduct.Brand=$scope.products[prodId].Brand;
        $scope.newProduct.MRP=$scope.products[prodId].MRP;
        $scope.newProduct.Cost=$scope.products[prodId].Cost;
        $scope.newProduct.Stock=$scope.products[prodId].Stock;
    }
}]);
app.controller('customersCtrl',["$scope", "$firebaseObject" ,function($scope,$http){
    $scope.messageCustExist=false;
    $scope.newCustomer=emptyCustomer();
    $scope.addNewCustomer = function(){  
        var tempNewCustomer={"Id": $scope.newCustomer.Id,"Name":$scope.newCustomer.Name,"Address":{"ShopName":$scope.newCustomer.Address.ShopName,"Line1":$scope.newCustomer.Address.Line1,"Line2":$scope.newCustomer.Address.Line2,"Place":$scope.newCustomer.Address.Place,"Pin":$scope.newCustomer.Address.Pin},"Phone":$scope.newCustomer.Phone,"InitialCredit": $scope.newCustomer.InitialCredit};
        $scope.customers[$scope.newCustomer.Id]=tempNewCustomer;  
        $scope.customers.$save().then(function(ref) {            
            $scope.newCustomer=emptyCustomer();
            tempNewCustomer={};
            alert("Updated");
        }, function(error) {
            alert("Something Went wrong: " , error);
        });
         //var dataToSend={"sales": $scope.sales, "purchases": $scope.purchases,"customers": $scope.customers, "products": $scope.products,"suppliers": $scope.suppliers,"transactions": $scope.transactions};
       /* var request = $http({
            method: "post",
            url: "update-json.php",
            data: dataToSend,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        request.success(function(data){
            $scope.newCustomer=emptyCustomer();
            tempNewCustomer={};
            alert(data);
        });*/
    }
    $scope.checkCustomer=function(custId){
        if($scope.customers[custId]){
            $scope.messageCustExist=true; 
        }
        else{
            $scope.messageCustExist=false;
        }
    }
    $scope.editCustomer= function(custId){
        $scope.messageCustExist=false;
        $scope.newCustomer=$scope.customers[custId];
    }
    
}]);
app.controller('suppliersCtrl',["$scope", "$firebaseObject" ,function($scope,$http){
    $scope.messageSuppExist=false;
    $scope.newSupplier=emptySupplier();
    $scope.addNewSupplier = function(){
        var tempNewSupplier={"Id": $scope.newSupplier.Id,"Name":$scope.newSupplier.Name,"Address":{"Line1":$scope.newSupplier.Address.Line1,"Line2":$scope.newSupplier.Address.Line2,"Place":$scope.newSupplier.Address.Place,"Pin":$scope.newSupplier.Address.Pin},"Phone":$scope.newSupplier.Phone,"InitialCredit": $scope.newSupplier.InitialCredit};
        $scope.suppliers[$scope.newSupplier.Id]=tempNewSupplier;
        $scope.suppliers.$save().then(function(ref) {            
            $scope.newSupplier=emptySupplier();
            tempNewSupplier={};
            alert("Updated");
        }, function(error) {
            alert("Something Went wrong: " , error);
        });
        /*var dataToSend={"sales": $scope.sales, "purchases": $scope.purchases,"customers": $scope.customers, "products": $scope.products,"suppliers": $scope.suppliers,"transactions": $scope.transactions};
        var request = $http({
            method: "post",
            url: "update-json.php",
            data: dataToSend,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        request.success(function(data){
            $scope.newSupplier=emptySupplier();
            alert(data);
            tempNewSupplier={};
        });*/
    }
    $scope.checkSupplier=function(suppId){
        if($scope.suppliers[suppId]){
            $scope.messageSuppExist=true; 
        }
        else{
            $scope.messageSuppExist=false;
        }
    }
    $scope.editSupplier= function(suppId){
        $scope.messageSuppExist=false;
        $scope.newSupplier=$scope.suppliers[suppId];
    }
    
}]);
app.controller('transactionsCtrl',["$scope", "$firebaseObject" ,function($scope,$http){
    $scope.CustSupp={};
    $scope.newTransaction={};
    $scope.newTransaction.Date = new Date();    
    $scope.addNewTransaction=function(){
        $scope.transactions.counter = ($scope.transactions.counter||0) +1;
        var transactionId = $scope.transactions.counter;
        transactionId =  "TRN"+ pad(transactionId);
        $scope.newTransaction.Id=transactionId;
        if($scope.customers[$scope.newTransaction.AccountId]){
           $scope.newTransaction.Account="customers" 
        }else if($scope.suppliers[$scope.newTransaction.AccountId]){
           $scope.newTransaction.Account="suppliers" 
        }
        var tempNewTransaction={"Id" : $scope.newTransaction.Id, "Date" :$scope.newTransaction.Date.getTime(),"AccountId": $scope.newTransaction.AccountId,"Account": $scope.newTransaction.Account, "Particulars": "Transaction","Given": ($scope.newTransaction.Given||0),"Received": ($scope.newTransaction.Received||0),"PaymentMode": "Cash"};
        $scope.transactions[tempNewTransaction.Id]=tempNewTransaction;
        $scope.transactions.$save().then(function(ref) {            
            $scope.newTransaction={};
            $scope.CustSupp.Name="";
            $scope.newTransaction.Date = new Date();
            alert("Updated");
        }, function(error) {
            alert("Something Went wrong: " , error);
        });
       /* var dataToSend={"sales": $scope.sales, "purchases": $scope.purchases,"customers": $scope.customers, "products": $scope.products,"suppliers":$scope.suppliers,"transactions": $scope.transactions};
        var request = $http({
            method: "post",
            url: "update-json.php",
            data: dataToSend,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        request.success(function(data){
            $scope.newTransaction={};
            $scope.CustSupp.Name="";
            $scope.newTransaction.Date = new Date();
            alert(data);
        });*/
        
    }
    $scope.isCustSupp =function(id){
        if(id==""){
            //
        }else if ($scope.suppliers[id]){
            $scope.CustSupp.Customer=false;            
            $scope.CustSupp.Supplier=true;
        }
        else if ($scope.customers[id]){
            $scope.CustSupp.Customer=true;            
            $scope.CustSupp.Supplier=false;
        }
    }
    
}]);

/*app.controller("AuthCtrl", ["$scope", "$firebaseAuth",
  function($scope, $firebaseAuth) {
    var ref = new Firebase("https://dbstock.firebaseio.com/");
    $scope.authObj = $firebaseAuth(ref);
      $scope.authObj.$authWithPassword({
          email: $scope.user.email,
          password: $scope.user.password
      }).then(function(authData) {
          console.log("Logged in as:", authData.uid);
      }).catch(function(error) {
          console.error("Authentication failed:", error);
      });
      
  }
]);*/


app.directive('sales',function(){
    return{
        restrict: 'E',
        templateUrl: 'templates/sales.html'
    }
});
app.directive('purchases',function(){
    return{
        restrict: 'E',
        templateUrl: 'templates/purchases.html'
    }
});
app.directive('products',function(){
    return{
        restrict: 'E',
        templateUrl: 'templates/products.html'
    }
});
app.directive('customers',function(){
    return{
        restrict: 'E',
        templateUrl: 'templates/customers.html'
    }
});
app.directive('suppliers',function(){
    return{
        restrict: 'E',
        templateUrl: 'templates/suppliers.html'
    }
});
app.directive('transactions',function(){
    return{
        restrict: 'E',
        templateUrl: 'templates/transactions.html'
    }
});
