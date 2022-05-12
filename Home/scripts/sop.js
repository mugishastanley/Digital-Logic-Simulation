data1=new String();
data2=new String();
data3=new String();
vars=new Array();
values=new Array();
pterms=new Array();
bracket=new Array();

// report error
function reportError(msg, i)
{
	if(i!=-1) errline=data2.substring(0,i)+'<SPAN STYLE="background:#000000"><FONT COLOR=#FF0000><B>'+posvar+'</B></FONT></SPAN>'+data2.substring(i+1);
	else errline='';
	document.getElementById('logictable').innerHTML='<FONT COLOR=#990000>'+msg+'</FONT><BR>'+errline;
}

// sort variables alphabetically
function sortVariables()
{
	var i,j,k;
	for(i=0;i<vars.length-1;++i)
		for(j=i+1;j<vars.length;++j)
		{
			if(vars[i]>vars[j])
			{
				k=vars[i];
				vars[i]=vars[j];
				vars[j]=k;
			}
		}
}

// -1 if the letter is not a variable, otherwise variable number
function isVariable(let)
{
	var j;
	for(j=0;j<vars.length;++j) if(let==vars[j]) return(j);
	return(-1);
}

// compute logic data2 with no brackets and return the logic value
function compute(startpos,endpos)
{
	var j;
	data3=data2.substring(startpos,endpos+1);
	for(j=0;j<=data3.length;++j)
	{
		if (data3.charAt(j+1)=='`' || data3.charAt(j+1)=="'")
		{
			if(data3.charAt(j)=='1') k=0; else k=1;
			data3=data3.substring(0,j)+k+data3.substring(j+2);
			--j;
		}
	}
	for(j=0;j<=data3.length;++j)
	{
		if ((data3.charAt(j)=='0' || data3.charAt(j)=='1') &&
				(data3.charAt(j+1)=='0' || data3.charAt(j+1)=='1'))
		{
			if(data3.charAt(j)=='1' && data3.charAt(j+1)=='1') k=1; else k=0;
			data3=data3.substring(0,j)+k+data3.substring(j+2);
			--j;
		}
		else if ((data3.charAt(j)=='0' || data3.charAt(j)=='1') &&
				data3.charAt(j+1)=='^')
		{
			if(data3.charAt(j)==data3.charAt(j+2)) k=0; else k=1;
			data3=data3.substring(0,j)+k+data3.substring(j+3);
			--j;
		}
	}
	var k=0;
	for(j=0;j<=data3.length;++j)
	{
		if(data3.charAt(j)=='1') {k=1; break;}
	}
	return(k);
}

// main evaluation data
function evaluateMe()
{
    vars.length=0;
	values.length=0;
	bracket.length=0;
	
	data=document.getElementById('expr').value;

	data1='';

	// parsing; level one: remove white spaces
	for(i=0;i<data.length;++i)
	{
		if(data.charCodeAt(i)>32) data1+=data.charAt(i);
	}

	// parsing; level two: find all variables
	for(i=0;i<data1.length;++i)
	{
		posvar=data1.charAt(i);
		if(posvar!='`' && posvar!="'" && posvar!='+' && posvar!='^' && posvar!='(' && posvar!=')')
		{
			// found an invalid character
			if(posvar<'a' || posvar>'z')
			{
				alert('Sorry, invalid character',i);
				return;
			}

			// found a variable
			for(j=0;j<vars.length;++j)
			{
				if(posvar==vars[j]) break;
			}
			if(j==vars.length) vars[j]=posvar;
		}
	}

	// parsing; level three: find parentheses and operands validity
	parlevel=0; prev=0;
	for(i=0;i<data1.length;++i)
	{
		next=data1.charAt(i+1);
		posvar=data1.charAt(i);
		if (posvar=='+' && ((prev!=')' && prev!='`' && prev!="'" && isVariable(prev)<0)
						|| ( next!='(' && isVariable(next)<0)))
		{
			// misplaced +
			alert('sorry, misplaced "+"',i);
			return;
		}
		if (posvar=='^' && ((prev!=')' && prev!='`' && prev!="'" && isVariable(prev)<0)
						|| (next!='(' && isVariable(next)<0)))
		{
			// misplaced ^
			alert('sorry, misplaced "^"',i);
			return;
		}
		if((posvar=='`' || posvar=="'") && prev!=')' && prev!="'" && prev!='`' && isVariable(prev)<0)
		{
			// misplaced `
			alert('sorry misplaced "'+"'"+'"',i);
			return;
		}
		if(posvar=='(') ++parlevel;
		if(posvar==')') 
		{
			if(!parlevel)
			{
				// too many ')' brackets
				alert('sorry, parentheses mismatch',i);
				return;
			}
			--parlevel;
		}
		prev=posvar;
	}
	if(parlevel)
	{
		// to few ')' brackets
		alert('sorry, parentheses missing',-1);
		return;
	}
	if(posvar=='+')
	{
		// + at the end of inputs
	alert('sorry, misplaced "+"',i-1);
		return;
	}

	sortVariables();

	// evaluating the expression; swap 1's and 0's for letters
	nosteps=(1<<vars.length);
	//added by geo
	pterms=new Array(nosteps);
	for(i=0;i<vars.length;++i) values[i]=0;
	k=0;
	s='<TABLE border=1 bgcolor ="#ffffff" cellspacing=10><td colspan="12">Truth table</td><TR>';
	//added by geo
	trm='<table border=1 bgcolor ="#ffffff" cellspacing=10><tr>';
	for(i=0;i<vars.length;++i){
	 s+='<TD><B>'+vars[i]+'</TD>';
	trm+='<TD><B>'+vars[i]+'</TD>';
	 }
	s+='<TD><B>output</TD></TR>';
	trm+='<TD><B>output</TD><td>terms</td></TR>';


	for(i=0;i<nosteps;++i)
	{
		// format output
		 pterms[i]=new Array(vars.length+1)

		s+'<TR>';
		for(j=0;j<vars.length;++j){
		 s+='<TD>'+values[j]+'</TD>';
		 //added by geo
		 pterms[i][j]=values[j];
		 }
		s+='<TD ALIGN=CENTER>';
		// replace letters by numbers
		data2=data1;
		for(j=0;j<data2.length;++j)if((k=isVariable(data2.charAt(j)))!=-1) data2=data2.substring(0,j)+values[k]+data2.substring(j+1);

		// evaluate.. sweep along parentheses to find which values to evaluate first
		bracketno=0;
		for(j=0;j<data2.length;++j)
		{
			if(data2.charAt(j)=='(') bracket[bracketno++]=j+1;
			if(data2.charAt(j)==')')
			{
				// found first occurence of closed brackets.. i.e. all data within the brackets
				// has no internal brackets
				k=compute(bracket[bracketno-1],j-1);
				data2=data2.substring(0,bracket[bracketno-1]-1)+k+data2.substring(j+1);
				j=bracket[bracketno-1]-1;
				--bracketno;
			}
		}
		k=compute(0,data2.length-1);
		s+=k+'</TD></TR>';
		//added by geo
		pterms[i][vars.length]=k;
		j=vars.length-1;
		while(j>=0)
		{
			values[j]=1-values[j];
			if(values[j]) break;
			--j;
		}
	}
	s+='</TABLE>';
	document.getElementById('results').innerHTML=s;
	//added by geo
	var minterm="";
	var sop="SoP=";
	for(x=0;x<nosteps;++x)
	{
	if(pterms[x][vars.length]!=0){
	trm+='<tr>';
	for(j=0;j<vars.length+1;++j){
		 trm+='<TD>'+pterms[x][j]+'</TD>';
		 if(j<vars.length){
		 if(pterms[x][j]==1)
		 minterm+=vars[j];
		 else
		  minterm+=vars[j]+"'";
		  }
		 }
		 trm+='<td>'+minterm+'</tr>';
		 sop+='('+minterm+')'
		 if(x!=nosteps-1)
		 sop+='+';
		 minterm="";
		 }
	}
	trm+='</table>';
	document.getElementById('minterms').innerHTML=trm;
	document.getElementById('mfction').innerHTML=sop;
	mfction
	//end goe	
}