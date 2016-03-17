function pad(number) {
    var n= 5-number.toString().length;
  for(var i=0;i<n;i++){      
      number = "0"+ number;
      }
    return(number);
}
function emptySale(){
    var a ={
        "Id":"",
        "Customer": "",
        "Date": "",
        "Items":[],
        "Discount": "",
        "TotalAmount": 0,
        "PaymentMethod": "Cash",
        "PaymentAmount": "" 
    };
    return a;
}
function emptyPurchase(){
    var a ={
        "Id":"",
        "Supplier": "",
        "Date": "",
        "Items":[],
        "Discount": "",
        "TotalAmount": 0,
        "PaymentMethod": "Cash",
        "PaymentAmount": "" 
    };
    return a;
}
function emptyCustomer(){
    var a= {"Id": "","Name":"","Address":{"ShopName":"","Line1":"","Line2":"","Place":"","Pin":""},"Phone":"","InitialCredit": ""};
    return(a);
}
function emptySupplier(){
    var a= {"Id": "","Name":"","Address":{"Line1":"","Line2":"","Place":"","Pin":""},"Phone":"","InitialCredit": ""};
    return(a);
}

function udpadeFireBase(db,data){    
    var ref = new Firebase("https://dbstock.firebaseio.com/" + db);
    var ob = data;
    ob.updatedAt = Firebase.ServerValue.TIMESTAMP;
    var child = ob.Id;
    ref.child(child).update(ob);
}