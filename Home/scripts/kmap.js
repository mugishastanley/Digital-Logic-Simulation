// for a good javascript reference, see http://wp.netscape.com/eng/mozilla/3.0/handbook/javascript/

// Constants
var MaxVariableCount=4;							
var VariableNames = new Array("A","B","C","D");	
var Width  = new Array(0,2,2,4,4);				// width of Kmap for each VariableCount
var Height = new Array(0,2,2,2,4);				// height of Kmap for each VariableCount
var BitOrder = new Array(0,1,3,2);				// bits across and down Kmap
var BackgroundColor="white";
var AllowDontCare=false;						// true doesn't guarantee a minimal solution
var DontCare = "X";

// Variables (initialized here)
var VariableCount=3;							//1..4
var TruthTable = new Array();					// truth table structure[row][variable]
var KMap = new Array();							// KMap[across][down]
var ShowRect = null;							// rect for the high-lighted term
var FunctionText = "";							// F(ABC)= 
			// 0xFFFF00;			


var Equation = new Array();						 
for (i=0; i<Math.pow(2,MaxVariableCount); i++)
{
	Equation[i] = new Array();					// for each term in result function
	Equation[i].ButtonUIName = "EQ" + i;		// used to generate HTML IDs
	Equation[i].Expression = "";				// HTML text for term 
	Equation[i].Rect = null;					// 'rect' for term 
	Equation.UsedLength=0;						// # of terms in current result function
}
Equation.UsedLength=1;
Equation[0].Expression="0";

// initialize the truth table and kmap structure for the given number of variables
function InitializeTables(VarCount)
{
	TruthTable = new Array();
	KMap = new Array();							
	ShowRect = null;


	VariableCount = VarCount;
	KMap.Width=Width[VariableCount];
	KMap.Height=Height[VariableCount];

	for (i=0; i<Math.pow(2,VariableCount); i++)
	{
		TruthTable[i] = new Array();
		TruthTable[i].Index = i;
		TruthTable[i].Name = i.toString(2);
		TruthTable[i].ButtonUIName = "TT"+TruthTable[i].Name;
		TruthTable[i].TTROWUIName = "TTROW" + TruthTable[i].Name;
		for (j=0; j<Math.pow(2,VariableCount); j++)
		{
			TruthTable[i][j] = new Array();
			TruthTable[i][j].Variable = (i & (1<<(VariableCount-(1+j)))?1:0)?true:false;
			TruthTable[i][j].Name = VariableNames[j];
			TruthTable[i][j].KMapEntry = null;
		}
	}

	KMap.XVariables = KMap.Width/2;
	KMap.YVariables = KMap.Height/2;

	for (w=0; w<KMap.Width; w++)
	{
		KMap[w]=new Array();
		for (h=0; h<KMap.Height; h++)
		{
			KMap[w][h]=new Array();
			KMap[w][h].Value = false;
			mapstr = BinaryString(BitOrder[w],KMap.XVariables) + BinaryString(BitOrder[h],KMap.YVariables);
			mapval = parseInt(mapstr,2);
			KMap[w][h].TruthTableEntry = TruthTable[mapval];
			KMap[w][h].TruthTableEntry.KMapEntry = KMap[w][h];
			KMap[w][h].ButtonUIName = "KM" + KMap[w][h].TruthTableEntry.Name;
			KMap[w][h].TDUIName = "TD" + KMap[w][h].TruthTableEntry.Name;
			KMap[w][h].Covered = false;
			KMap[w][h].Variable = new Array();
			for (i=0; i<VariableCount; i++)
			{
				KMap[w][h].Variable[i] = KMap[w][h].TruthTableEntry[i].Variable;
			}
		}
	}

	FunctionText = "F(";
	for (i=0; i<VariableCount; i++)
	{
		FunctionText += VariableNames[i];
	}
	FunctionText+=")";

}

InitializeTables(VariableCount);

function HighlightColor( Value )
{
	if (Value=="1") return "white";    //0x00FF00;
	if (Value=="0") return "white"; //~0xFF0000;
	return "white"; //0x7F7F7F;
}

function RectHighlightColor( Value )
{
	return EquationHighlightColor;
}

// init code (setup according to query parameters)
function Load()
{
	if (PageParameter("Variables")=="3")
	{
		ChangeVariableNumber( 3 );
	}
	else if (PageParameter("Variables")=="2")
	{
		ChangeVariableNumber( 2 );
	}
	else if (PageParameter("Variables")=="4")
	{
		ChangeVariableNumber( 4 );
	}
	else 
	{
		ChangeVariableNumber( VariableCount );
	}
	if (PageParameter("DontCare")=="true")
	{
		ToggleDontCare();
	}
}
//window.onload = Load;

function CreateRect( x,y,w,h )
{
	var Obj=new Array();
	Obj.x = x;
	Obj.y = y;
	Obj.w = w;
	Obj.h = h;
	return Obj;
}

function Compare( Value1, Value2 )
{
	if ( (Value1 == Value2) || (Value1==DontCare) || (Value2==DontCare) )
	{
		return true;
	}
	else
	{
		return false;
	}
}
	

function TestRect( Rect, TestValue )
// assumes top left of Rect is within the KMap.
// assumes Rect is not larger than KMap
{
	var dx=0;
	var dy=0;
	for (dx=0; dx<Rect.w; dx++)
	{
		for (dy=0; dy<Rect.h; dy++)
		{
			var Test = KMap[(Rect.x+dx)%KMap.Width][(Rect.y+dy)%KMap.Height].Value;
			if (!Compare(TestValue,Test))
			{
				return false;
			}
		}
	}
	return true;
}
			
function IsCovered( Rect )
{
	var dx=0;
	var dy=0;
	for (dx=0; dx<Rect.w; dx++)
	{
		for (dy=0; dy<Rect.h; dy++)
		{
			if (!KMap[(Rect.x+dx)%KMap.Width][(Rect.y+dy)%KMap.Height].Covered) 
			{
				//treat dont care's as already covered
				if (!(KMap[(Rect.x+dx)%KMap.Width][(Rect.y+dy)%KMap.Height].Value==DontCare))
				{
					return false;
				}
			}
		}
	}
	return true;
}
			
function Cover( Rect, IsCovered )
{
	var dx=0;
	var dy=0;
	for (dx=0; dx<Rect.w; dx++)
	{
		for (dy=0; dy<Rect.h; dy++)
		{
			KMap[(Rect.x+dx)%KMap.Width][(Rect.y+dy)%KMap.Height].Covered = IsCovered;
		}
	}
}

function SearchRect( w,h, TestValue, Found )
{
	if ((w>KMap.Width) || (h>KMap.Height))
	{
		return;  // rect is too large
	}
		
	var x=0;
	var y=0;
	for (x=0; x<KMap.Width; x++)
	{
		for (y=0; y<KMap.Height; y++)
		{
			var Rect = CreateRect(x,y,w,h);
			if (TestRect(Rect,TestValue))
			{
				if (!IsCovered(Rect))
				{
					Found[Found.length]=Rect;
					Cover(Rect,true);
				}
			}
		}
	}
}
			
function Search()
{
	var Rects = new Array();
	Cover(CreateRect(0,0,KMap.Width,KMap.Height),false);
	SearchRect(4,4,true,Rects);
	SearchRect(4,2,true,Rects);
	SearchRect(2,4,true,Rects);
	SearchRect(1,4,true,Rects);
	SearchRect(4,1,true,Rects);
	SearchRect(2,2,true,Rects);
	SearchRect(1,2,true,Rects);
	SearchRect(2,1,true,Rects);
	SearchRect(1,1,true,Rects);
	
	//check to see if any sets of smaller rects fully cover larger ones (so the larger one is no longer needed)
	Cover(CreateRect(0,0,KMap.Width,KMap.Height),false);
	for (i=Rects.length-1; i>=0; i--)
	{
		if (IsCovered(Rects[i]))
		{
			Rects[i]=null;
		}
		else
		{
			Cover(Rects[i],true);
		}
	}
	
	
	ClearEquation();	
	for (i=0;i<Rects.length; i++)
	{
		if (Rects[i]!=null)
		{
			RectToEquation(Rects[i]);
		}
	}
	if (Equation.UsedLength==0)
	{
		Equation.UsedLength=1;
		Equation[0].Expression="0";
		Equation[0].Rect = CreateRect(0,0,KMap.Width,KMap.Height);
	}
}

function ClearEquation()
{
	for (i=0; i<Equation.length; i++)
	{
		Equation[i].Rect	= null;
	}
	Equation.UsedLength=0;
	ShowRect = null;
}

function IsConstantVariable( Rect, Variable )
{
	var dx=0;
	var dy=0;
	var topleft = KMap[Rect.x][Rect.y].Variable[Variable];
	for (dx=0; dx<Rect.w; dx++)
	{
		for (dy=0; dy<Rect.h; dy++)
		{
			test = KMap[(Rect.x+dx)%KMap.Width][(Rect.y+dy)%KMap.Height].Variable[Variable];
			if (test!=topleft)
			{
				return false;
			}
		}
	}
	return true;
}

function RectToEquation( Rect )
{
	var Text = "";
	var i=0;
	for (i=0; i<VariableCount; i++)
	{
		if (IsConstantVariable( Rect, i))
		{
					if (!KMap[Rect.x][Rect.y].Variable[i])
			{
				Text += "<span style='text-decoration: overline'>"+VariableNames[i]+"</span> ";
			}
			else
			{
				Text += VariableNames[i] + " ";
			}
		}
	}
	if (Text.length==0)
	{
		Text="1";
	}
	Equation[Equation.UsedLength].Rect  = Rect;
	Equation[Equation.UsedLength].Expression = Text;
	Equation.UsedLength++;
	
	return Text;
}
	

function DisplayValue( bool )
{
	if (bool==true)
	{
		return "1";
	}
	else if (bool==false)
	{
		return "0";
	}
	else return DontCare;
}

function BinaryString( value, bits )
{
	var str = value.toString(2);
	var i=0;
	for (i=0; i<bits; i++)
	{
		if (str.length<bits)
		{
			str = "0" + str;
		}
	}
	return str;
}

function UpdateUI()
{
	var i=0;
	for (i=0;i<TruthTable.length; i++)
	{
		var Val = DisplayValue(TruthTable[i].KMapEntry.Value);
		//Truth Table
		SetValue(TruthTable[i].ButtonUIName,Val);
		SetBackgroundColor(TruthTable[i].ButtonUIName, HighlightColor(Val));
		SetBackgroundColor(TruthTable[i].TTROWUIName,  HighlightColor(Val));
		//KMap
		SetValue(TruthTable[i].KMapEntry.ButtonUIName,Val);
		SetBackgroundColor(TruthTable[i].KMapEntry.ButtonUIName,HighlightColor(Val));
		SetBackgroundColor(TruthTable[i].KMapEntry.TDUIName,HighlightColor(Val));
	}
	SetInnerHTML("EquationDiv",GenerateEquationHTML());

	if (ShowRect!=null)
	{
		var dx=0;
		var dy=0;
		for (dx=0; dx<ShowRect.w; dx++)
		{
			for (dy=0; dy<ShowRect.h; dy++)
			{
				var KMEntry = KMap[(ShowRect.x+dx)%KMap.Width][(ShowRect.y+dy)%KMap.Height];
				//KMap
				SetBackgroundColor(KMEntry.ButtonUIName, RectHighlightColor(Val));
				SetBackgroundColor(KMEntry.TDUIName,     RectHighlightColor(Val));
				//Truth Table
				SetBackgroundColor(KMEntry.TruthTableEntry.ButtonUIName, RectHighlightColor(Val));
				SetBackgroundColor(KMEntry.TruthTableEntry.TTROWUIName,  RectHighlightColor(Val));
			}
		}
	}
		
	
}
	
function ToggleValue( Value )
{
	if (AllowDontCare)
	{
		if (Value==true)
		{
			return DontCare;
		}
		else if (Value==DontCare)
		{
			return false;
		}
		else if (Value==false)
		{
			return true;
		}
	}
	else
	{
		return !Value;
	}
}

function ToggleTTEntry( TTEntry )
{
	TTEntry.KMapEntry.Value = ToggleValue(TTEntry.KMapEntry.Value);
	RefreshUI();
}

function ToggleKMEntry( KMEntry )
{
	KMEntry.Value = ToggleValue(KMEntry.Value);
	RefreshUI();
}

function RefreshUI()
{
	ClearEquation();
	Search();
	UpdateUI();
}

function SetShowRect( EquationEntry, EquationIndex )
{	
	if (EquationEntry==null)
	{
		if (ShowRect!=null)
		{
			ShowRect= null;
			UpdateUI();
		}
		return;
	}
	if (ShowRect!=EquationEntry.Rect)
	{
		ShowRect = EquationEntry.Rect;
		UpdateUI();
	}
	SetBackgroundColor(Equation[EquationIndex].ButtonUIName,EquationHighlightColor);
}

function GetElement(Name)
{
	if (document.getElementById)
	{
		return document.getElementById(Name);
	}
	else if (document.all)
	{
		return document.all[Name];
	}
	else if (document.layers)
	{
		
	}
}

function SetInnerHTML(Name,Text)
{
	GetElement(Name).innerHTML = Text
}

function SetBackgroundColor(Name,Color)
{
	GetElement(Name).style.backgroundColor = Color;
}

function SetValue(Name,Value)
{
	GetElement(Name).value = Value;
}

function GenerateTruthTableHTML()
{
	var Text = "<center><b>Truth Table</b><br></center><table ID=\"TruthTableID\" border=1>";
	{
		Text = Text + "<tr>";
		var i=0;
		for (i=0; i<VariableCount; i++)
		{
			Text = Text + "<th>"+VariableNames[i]+"</th>";
		}
		Text = Text + "<th>"+FunctionText+"</th></tr>";
			
		for (i=0; i<TruthTable.length; i++)
		{
			Text += "<tr ID='"+TruthTable[i].TTROWUIName+"';>";  
			var j=0;
			for (j=0; j<VariableCount; j++)
			{
				Text = Text + "<td>"+DisplayValue(TruthTable[i][j].Variable)+"</td>";
			}
			Text = Text
				+ "<td><input ID="+TruthTable[i].ButtonUIName +" name="+TruthTable[i].ButtonUIName +" type='button'; style='width:100%'; value='"+DisplayValue(TruthTable[i].KMapEntry.Value)+"'; onClick=ToggleTTEntry(TruthTable["+i+"]); ></td>" 
				+ "</tr>";
		}
	}
	Text = Text + "</table>";
	return Text;
}

function GenerateKarnoMapHTML()
{
	var Text = "<table ><tr><th><center>Karnaugh Map</center></th></tr><tr><td>";
	Text = Text + "<table border=1 cellpadding=0>";
	var h,w;
	Text = Text + "<tr><th></th><th></th><th colspan="+(KMap.Width)+">";
	for (i=0; i<KMap.XVariables; i++)
	{
		Text += VariableNames[i];
	}
	Text += "</th></tr>";
	Text += "<tr>";
	Text += "<th></th><th></th>";
	for (i=0; i<KMap.Width; i++)
	{
		Text += "<th>"+BinaryString(BitOrder[i],KMap.XVariables)+"</th>";
	}
	Text+="</tr>";
	
	for (h=0; h<KMap.Height; h++)
	{
		Text = Text + "<tr>";
		if (h==0)
		{
			Text += "<th rowspan="+(KMap.Height)+">";
			for (i=0; i<KMap.YVariables; i++)
			{
				Text += VariableNames[i+KMap.XVariables];
			}
		}
		Text += "<th>"+BinaryString(BitOrder[h],KMap.YVariables)+"</th>";

		for (w=0; w<KMap.Width; w++)
		{
			Text += "<td  ID='"+KMap[w][h].TDUIName+"';>"
					+ "<input ID="+KMap[w][h].ButtonUIName +" name="+KMap[w][h].ButtonUIName +" type='button'  value='"+DisplayValue(KMap[w][h].Value)+"'; onClick=ToggleKMEntry(KMap["+w+"]["+h+"]);>"
					+ "</td>";
		}
		Text += "</tr>";
	}
	Text += "</table>";
	Text+="</td></tr></table>";
	return Text;
}

function GenerateEquationHTML()
{
	var j;
	var Text = "<p><p>";
	var i;
	for (i=0; i<Equation.UsedLength; )
	{
	Text += "<table>";
	for (j=0; (j<4) && (i<Equation.UsedLength); j++)
	{
		if (i==0) Text+= "<td><b>"+FunctionText + "=</td>";
		if (i==4) Text+= "<td width=75></td>";
		Text += "<td ID="+Equation[i].ButtonUIName;
		Text += " onMouseOver=SetShowRect(Equation["+i+"],"+i+"); onMouseOut=SetShowRect(null); ";
//<span style="text-decoration: overline">overline</span>
		Text += "><b>" + Equation[i].Expression + "</td>";
		if (i<Equation.UsedLength-1) Text +="<td> + </td>";
		i++;
	}	
	Text+="</table>";
	}
	return Text;
}

function ChangeVariableNumber( Num )
{
	InitializeTables(Num);
	ClearEquation();
	SetInnerHTML("TruthTableDiv",GenerateTruthTableHTML());
	SetInnerHTML("KarnoMapDiv",GenerateKarnoMapHTML());
	SetInnerHTML("EquationDiv",GenerateEquationHTML());
	GetElement("TwoVariableRB").checked   = (Num==2)?true:false;
	GetElement("ThreeVariableRB").checked = (Num==3)?true:false;
	GetElement("FourVariableRB").checked  = (Num==4)?true:false;
	Search();
	UpdateUI();
}

function ToggleDontCare()
{
	AllowDontCare=!AllowDontCare;
	var i=0;
	for (i=0;i<TruthTable.length; i++)
	{
		if (TruthTable[i].KMapEntry.Value==DontCare)
		{
			TruthTable[i].KMapEntry.Value=false;
		}
	}
	ChangeVariableNumber(VariableCount);
	GetElement("AllowDontCareCB").checked = AllowDontCare;
}

function PageParameter( Name )
{
	var Regex = new RegExp( "[\\?&]"+Name+"=([^&#]*)" );
	var Results = Regex.exec( window.location.href );
	if( Results != null )
	{
		return Results[1];
	}
	return "";
}