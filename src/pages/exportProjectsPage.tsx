import {Button } from '@itwin/itwinui-react';
import React, { useState } from 'react'
import { BentleyAPIFunctions } from '../helper/BentleyAPIFunctions';


interface PageStuff{
  isAuthorized:boolean;
}

function ExportProjectsPage({isAuthorized }:PageStuff) {
  
  const [logger, setLogger] = useState<JSX.Element>();
 
    const info:JSX.Element[]= [];
    const working:JSX.Element[]= [];
    info.push(<Button key="exportProjs" size="large" onClick={() => {setLogger(<h1>Please wait getting excel ready..</h1>); BentleyAPIFunctions.exportProjectsToExcel(setLogger); }}>Export All Project Details to Excel</Button>); 
   return (
    <div>
      {info}
      <div>{logger}</div>
    </div>
  )
}

export default ExportProjectsPage

