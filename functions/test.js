function test(){
	var split = [{"choice":"true","id":0},{"choice":"false","id":1}]
     
 

    var list = []
	//var str = JSON.stringify(split);  
	var newArr = JSON.parse(split.toString());  
	var x=0
	for (x in newArr) {  
		list[x] = newArr[x]
		x++
     }

	console.log(list)
   // for(var x in split)     
   // {
   // 		console.log(list[x]+'\n')

   // }    
}
test()