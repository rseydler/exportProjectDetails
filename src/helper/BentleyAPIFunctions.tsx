import AuthorizationClient from "./AuthorizationClient";
import * as Excel from 'exceljs';

export class BentleyAPIFunctions{

  public static async getUsersEmailFromGuid(userGuid:string, projectId:string, accessToken:any, setLogger:any){
    if(userGuid === null){
        return "Check your issue!";
    }
    const response = await fetch(`https://api.bentley.com/projects/${projectId}/members/${userGuid}`, {
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': accessToken,
              },
        })
        const data = await response;
        if (data.status === 404)
        {
            //most likely a role, or use has been ejected :(
            return "UNKNOWN";
        }
        
        const json = await data.json();
        if (json == null){
          return "UNKNOWN";
        }
        if ("member" in json){
          if (json.member === null){
            return ("UNKNOWN");
          }
          if ("email" in json.member)
          {
              if (json.member.email.trim() === "")
              {
                  return ("UNKNOWN");
              }
              else{
                  return (json.member.email);
              }
          }
        }
        else{
            return ("UNKNOWN");
        }

}


  public static async getAllProjectsDataFull(setLogger : any){
    var looper=true;
    const accessToken = await (await AuthorizationClient.oidcClient.getAccessToken()).toTokenString();
    var urlToQuery : string = `https://api.bentley.com/projects/?$top=1000`;
    const projectsData: any[] = [];
    var x = 0;
    while (looper) {
      x = x + 1000;
      setLogger(`Extracting data.. < ${x}`);
      
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

        for (var i = 0; i < json.projects.length; i++){
          setLogger(`Extracting data.. < ${x} - Looking for owners email from ${json.projects[i].registeredBy} - Row ${i}`);
          json.projects[i].registeredBy = await this.getUsersEmailFromGuid(json.projects[i].registeredBy, json.projects[i].id, accessToken, setLogger);
          projectsData.push(json.projects[i]);
        }

        /*
        json.projects.forEach((project: any) => {
          projectsData.push(project);
        });
        */
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

  public static exportProjectsToExcel(setLogger :any){
  
    (async () => {
      setLogger(<h1>Grabbing project data...</h1>);
      var allProjectData = await BentleyAPIFunctions.getAllProjectsDataFull(setLogger);
      const wb = new Excel.Workbook();
      var ws = wb.addWorksheet("projects");
      var currCol = 1;
      var currRow = 1
      for (var project in allProjectData){
        setLogger(<h1>Looping throught projects...</h1>);
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
      setLogger(<h1>Done</h1>);
      return undefined;
    })();
  }
  

}

