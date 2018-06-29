import React, { Component } from 'react'
import ApplyTheme from '@instructure/ui-core/lib/components/ApplyTheme'
import Container from '@instructure/ui-core/lib/components/Container'
import FilterableAppointmentGroupTable from "./FilterableAppointmentGroupTable"
import Grid, { GridRow, GridCol } from '@instructure/ui-core/lib/components/Grid'
import Breadcrumb, {BreadcrumbLink} from '@instructure/ui-core/lib/components/Breadcrumb'
import { Link } from "react-router-dom"
import api from "../utils/api"
import axios from "axios"
import Loading from "./Loading"

class Home extends Component {
    constructor() {
        super();

        this.state = {
            apptGroups: null,
            locations: [],
            activeCourses: null,
            showAlert: false,
            alertMessage: '',
            alertType: '',
            isLoading: true
        };

        this.handleApptGroupsChange = this.handleApptGroupsChange.bind(this);
        this.handleDeleteApptGroup = this.handleDeleteApptGroup.bind(this);
        this.handleShowAlertDismiss = this.handleShowAlertDismiss.bind(this);
    }

    handleApptGroupsChange(alertMessage, alertType, disableRefresh){
        this.setState({isLoading: true});
        if(!disableRefresh){
            api.fetchUsersApptGroups(sessionStorage.userId).then(function(apptGroupsResponse){
                this.setState({
                    apptGroups: apptGroupsResponse.apptGroups ? apptGroupsResponse.apptGroups : [],
                    locations: apptGroupsResponse.locations ? apptGroupsResponse.locations : [],
                    alertMessage: alertMessage,
                    alertType: alertType,
                    showAlert: true,
                    isLoading: false
                });
            }.bind(this));
            this.setState({showAlert: false});
        }
        else{
            this.setState({
                alertMessage: alertMessage,
                alertType: alertType,
                showAlert: true,
                isLoading: false
            });
        }
    }

    handleShowAlertDismiss(){
        this.setState({showAlert: false});
    }

    handleDeleteApptGroup(apptGroupId, alertMessage, alertType, notifyParticipants){
        this.setState({isLoading: true});
        api.deleteApptGroup(sessionStorage.userId, apptGroupId, notifyParticipants).then(function(response){
            this.handleApptGroupsChange(alertMessage,alertType);
        }.bind(this)).catch((error)=>{
            this.handleApptGroupsChange(error.response.data.errorMessage,'error',true);
        });
        this.setState({showAlert: false});
    }

    componentDidMount() {
        axios.all([api.fetchUsersApptGroups(sessionStorage.userId),api.fetchActiveCourses(sessionStorage.userId)])
            .then(axios.spread(function(apptGroupsResponse,activeCourses){
                this.setState(function(){
                    return {
                        apptGroups: apptGroupsResponse.apptGroups ? apptGroupsResponse.apptGroups : [],
                        locations: apptGroupsResponse.locations ? apptGroupsResponse.locations : [],
                        activeCourses: activeCourses ? activeCourses : [],
                        isLoading: false
                    }
                });
            }.bind(this)));
    }
    render() {
        return (
            <ApplyTheme theme={ApplyTheme.generateTheme('canvas', {
                    'ic-brand-primary': '#00356b',
                    'ic-brand-button--primary-bgd': '#00356b',
                    'ic-link-color': '#286dc0'
                }
            )}
            >
                <Container
                    as="div"
                    size="auto"
                    textAlign="start"
                    margin="small"
                >
                    <Loading isLoading={this.state.isLoading}/>
                    <Grid vAlign="middle" colSpacing="none" >
                        <div style={{borderBottom:"0.0625rem solid #C7CDD1", paddingBottom:"0.125rem"}}>
                            <GridRow>
                                <GridCol>
                                    <Breadcrumb size="large" label="You are here:">
                                        <Link to="/signup"><BreadcrumbLink onClick={function () {}}>Sign Up BETA</BreadcrumbLink></Link>
                                    </Breadcrumb>
                                </GridCol>
                            </GridRow>
                        </div>
                    </Grid>
                    {(this.state.apptGroups && this.state.activeCourses) &&
                        <FilterableAppointmentGroupTable
                            apptGroups={this.state.apptGroups}
                            activeCourses={this.state.activeCourses}
                            onApptGroupsChange={this.handleApptGroupsChange}
                            onApptGroupDelete={this.handleDeleteApptGroup}
                            showAlert={this.state.showAlert}
                            alertMessage={this.state.alertMessage}
                            alertType={this.state.alertType}
                            locations={this.state.locations}
                            onShowAlertDismiss={this.handleShowAlertDismiss}
                        />
                    }
                </Container>
            </ApplyTheme>
        );
    }
}

export default Home;