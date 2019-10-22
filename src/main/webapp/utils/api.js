import axios from 'axios'

function handleError(error){
    console.warn(error);
    return null;
}

export default {
    fetchUsersApptGroups: function (){
        return axios.get('/signup/appointmentGroups/viewAppts').then(function(response){
            return response.data;
        }).catch(handleError)
    },
    fetchActiveCourses: function (){
        return axios.get('/signup/appointmentGroups/listActiveCourses').then(function(response){
            return response.data;
        }).catch(handleError)
    },
    deleteApptGroup: function (apptGroupId, notifyParticipants){
        return axios.delete('/signup/appointmentGroups/' + apptGroupId + '?notifyParticipants=' + notifyParticipants).then(function(response){
            return response;
        })
    },
    fetchSingleApptGroupDetails: function(apptGroupId){
        return axios.get('/signup/appointmentGroups/single/' + apptGroupId + '/slots').then(function(response){
            return response.data;
        }).catch(handleError)
    },
    deleteSingleAppt: function (apptId, comments){
        return axios.delete('/signup/appointmentGroups/slot/' + apptId + '?comments=' + comments).then(function(response){
            return response;
        }).catch(handleError)
    },
    reserveApptSlot: function(apptId, participantId, comments){
        return axios.post('/signup/appointmentGroups/slot/' + apptId + '?participantId=' + participantId, {comments: comments}).then(function(response){
            return response;
        })
    },
    unreserveApptSlot: function(apptId, reservationId, comments){
        return axios.put('/signup/appointmentGroups/slot/' + apptId + '/unreserve?reservationId=' + reservationId, {comments: comments}).then(function(response){
            return response;
        })
    },
    fetchUserProfile: function(){
        return axios.get('/signup/profile').then(function(response){
            return response;
        })
    }
};