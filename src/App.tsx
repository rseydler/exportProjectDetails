import "./App.scss";

import React, { useCallback, useEffect, useState } from "react";
import AuthorizationClient from "./helper/AuthorizationClient";
import {SvgNetwork,  SvgSettings, SvgFitToView, SvgProcess} from "@itwin/itwinui-icons-react";
import {Header, HeaderBreadcrumbs, HeaderButton, HeaderLogo, IconButton, MenuItem, SidenavButton, SideNavigation, UserIcon} from "@itwin/itwinui-react";
import {BentleyAPIFunctions } from "./helper/BentleyAPIFunctions";
import {ThemeButton} from "./helper/ThemeButton";
import {UnderlinedButton } from "@bentley/ui-core";
import ExportProjectsPage from "./pages/exportProjectsPage";

const App: React.FC = () => {

  //#region loginStuff
  const [isAuthorized, setIsAuthorized] = useState(
    AuthorizationClient.oidcClient
      ? AuthorizationClient.oidcClient.isAuthorized
      : false
  );
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const initOidc = async () => {
      if (!AuthorizationClient.oidcClient) {
        await AuthorizationClient.initializeOidc();
      }

      try {
        // attempt silent signin
        await AuthorizationClient.signInSilent();
        setIsAuthorized(AuthorizationClient.oidcClient.isAuthorized);
      } catch (error) {
        // swallow the error. User can click the button to sign in
      }
    };
    initOidc().catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    if (isLoggingIn && isAuthorized) {
      setIsLoggingIn(false);
    }
  }, [isAuthorized, isLoggingIn]);

  const onLoginClick = async () => {
    setIsLoggingIn(true);
    await AuthorizationClient.signIn();
  };

  const onLogoutClick = async () => {
    setIsLoggingIn(false);
    await AuthorizationClient.signOut();
    setIsAuthorized(false);
  };

  //#endregion

  const [selectedProject, setselectedProject] = useState({name: "Please select", description: "a project", id: ""});
  const [bodyData, setbodyData] = useState<JSX.Element[]>([]);
  const [whatSideBar, setwhatSideBar] = useState("");

  //#region loads the last selected sidebar from localstorage
  useEffect(() => {
    if (whatSideBar.trim() !== ""){
      localStorage.setItem("sidemenu", whatSideBar);
    }
  },[whatSideBar])

  useEffect(() => {
    const storedFlag = localStorage.getItem("sidemenu");
    if (storedFlag === null || ""){
      setwhatSideBar("ExportProjects");
    }
    else{
      setwhatSideBar(storedFlag);
    }
  },[])

  //#endregion

  //#region sidebar selection page generator
  useEffect(() =>  {
    if (whatSideBar === "ExportProjects") // iModel Shared Views Page
    {
      const bodyData: JSX.Element[] = [];
      bodyData.push(<ExportProjectsPage key="expProjects" isAuthorized={isAuthorized} />) 
      setbodyData(bodyData);
    }
  
    if (whatSideBar === "Settings") // Settings Page
    {
      const bodyData: JSX.Element[] = [];
      bodyData.push(<h1 key="settingsPage">This page not currently in use</h1>);
      setbodyData(bodyData);
    }

  },[whatSideBar, selectedProject])
//#endregion


  return (
    <div className="app">
       <Header
       appLogo={<HeaderLogo logo={<SvgSettings />}>Export Project Details</HeaderLogo>}
        actions={[<ThemeButton key="themeSwitched" />]}
        userIcon={
          <IconButton styleType="borderless"  onClick={() => {isAuthorized ? onLogoutClick() : onLoginClick()} }>
            <UserIcon
            className={isAuthorized===true ? "App-logo-noSpin" : "App-logo"} 
              size="medium"
              status={isAuthorized ? "online" : "offline"} 
              image={
                <img
                  src="https://itwinplatformcdn.azureedge.net/iTwinUI/user-placeholder.png"
                  alt="User icon"
                />
              }
            />
          </IconButton>
        }
      />
      <div className="app-body">
        <SideNavigation
          items={[
            <SidenavButton onClick={() => {setwhatSideBar("ExportProjects")}} isActive={whatSideBar==="ExportProjects" ? true : false} startIcon={<SvgProcess />} key="ExportProjects">
              Export Project Details
            </SidenavButton>
        ]}
        secondaryItems={[
          <SidenavButton onClick={() => {setwhatSideBar("Settings")}} isActive={whatSideBar==="Settings" ? true : false} startIcon={<SvgSettings />} key="settings">
            Settings
          </SidenavButton>
        ]}
        />       
       <div className="app-container">
          <div className="app-content">
            {isLoggingIn ? ( <span>"Logging in...."</span> ) : (!isAuthorized ? (<h1>You need to <UnderlinedButton title="login" onClick={() => { isAuthorized ? onLogoutClick() : onLoginClick(); } } children={"login"}></UnderlinedButton> first.</h1>) : (bodyData))}
          </div>
        </div>
    </div>
  </div>
  );
};

export default App;


