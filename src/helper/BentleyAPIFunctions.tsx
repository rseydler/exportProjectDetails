import AuthorizationClient from "./AuthorizationClient";
import * as Excel from 'exceljs';

export class BentleyAPIFunctions{

  public static async getAllProjectsDataFull(){
    var looper=true;
    const accessToken = await (await AuthorizationClient.oidcClient.getAccessToken()).toTokenString();
    var urlToQuery : string = `https://api.bentley.com/projects/?$top=1000`;
    const projectsData: any[] = [];
    while (looper) {
        const response = await fetch(urlToQuery, {
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': accessToken,
                'Prefer': 'return=representation',
              },
        })
        const data = await response;
        const json = await data.json();

        json.projects.forEach((project: any) => {
          projectsData.push(project);
        });
        //let see if we are continuing.
        try {
            if (json._links.next.href){
                looper = true;
                urlToQuery = json._links.next.href;
                //console.log("contURL", urlToQuery);
            }
        }
        catch (error) {
            // better than traversing the object for === undefined?
            // swallow the missing link error and stop the loop
            looper = false;
        }
    }
    //console.log("returning projects accumulated data", projectsData);

    return projectsData;
  }


  public static downloadExportedIssues(theWorkbook:Excel.Workbook){
    theWorkbook.xlsx.writeBuffer( {
        //base64: true
    })
    .then( function (xls64: BlobPart) {
        // build anchor tag and attach file (works in chrome)
        var a = document.createElement("a");
        var data = new Blob([xls64], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

        var url = URL.createObjectURL(data);
        a.href = url;
        a.download = "MyProjectExport.xlsx";
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            },
            0);
    })
    .catch(function(error:any ) {
        console.log(error.message);
    });
}

  public static exportProjectsToExcel(){
  
    (async () => {
      var allProjectData = await BentleyAPIFunctions.getAllProjectsDataFull();
      const wb = new Excel.Workbook();
      var ws = wb.addWorksheet("projects");
      var currCol = 1;
      var currRow = 1
      for (var project in allProjectData){
          for (var projData in allProjectData[project]){
              const proj = allProjectData[project];
              if("_links" in proj){
                  delete proj._links;
              }
              //console.log("got this.." ,projData, proj[projData]);
              ws.getCell(1, currCol).value = projData;
              ws.getCell(currRow+1, currCol++).value = proj[projData];
          }
          currRow++;
          currCol = 1;
      }
      BentleyAPIFunctions.downloadExportedIssues(wb);
      return undefined;
    })();
  }
  

}

