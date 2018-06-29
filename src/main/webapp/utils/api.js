import axios from 'axios'

function handleError(error){
    console.warn(error);
    return null;
}

module.exports = {
    fetchUsersApptGroups: function (userId){
        return axios.get('/signup/appointmentGroups/viewAppts?userId=' + userId).then(function(response){
            return response.data;
        }).catch(handleError)
    },
    fetchActiveCourses: function (userId){
        return axios.get('/signup/appointmentGroups/listActiveCourses?userId=' + userId).then(function(response){
            return response.data;
        }).catch(handleError)
    },
    deleteApptGroup: function (userId, apptGroupId, notifyParticipants){
        return axios.delete('/signup/appointmentGroups/' + apptGroupId + '?userId=' + userId + '&notifyParticipants=' + notifyParticipants).then(function(response){
            return response;
        })
    },
    fetchSingleApptGroupDetails: function(userId, apptGroupId){
        return axios.get('/signup/appointmentGroups/single/' + apptGroupId + '/slots?userId=' + userId).then(function(response){
            return response.data;
        }).catch(handleError)
    },
    deleteSingleAppt: function (userId, apptId, comments){
        return axios.delete('/signup/appointmentGroups/slot/' + apptId + '?userId=' + userId + '&comments=' + comments).then(function(response){
            return response;
        }).catch(handleError)
    },
    reserveApptSlot: function(userId, apptId, participantId, comments){
        return axios.post('/signup/appointmentGroups/slot/' + apptId + '?userId=' + userId + '&participantId=' + participantId, {comments: comments}).then(function(response){
            return response;
        })
    },
    unreserveApptSlot: function(userId, apptId, reservationId, comments){
        return axios.put('/signup/appointmentGroups/slot/' + apptId + '/unreserve?userId=' + userId + '&reservationId=' + reservationId, {comments: comments}).then(function(response){
            return response;
        })
    }
};