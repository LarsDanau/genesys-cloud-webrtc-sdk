(function() {
  function getActiveConversations() {
    let outputHeader = 'activeConversations\n---------------------\n\n';

    conversationsApi.getConversations()
      .then((data) => {
        writeToLog(`${outputHeader}${JSON.stringify(data)}`);
      })
      .catch((err) => {
        writeToLog(`${outputHeader}${JSON.stringify(data)}`);
      });
  }

  function makeOutboundCall() {
    const numberToCall = document.getElementById('outbound-phone-number').value;
    if (!numberToCall) {
      document.getElementById('output-data').value += 'Phone Number is required to place an outbound call\n';
      return;
    }

    let body = {phoneNumber: numberToCall};
    conversationsApi.postConversationsCalls(body)
      .then((data) => {
        currentConversationId = data.id;
      })
      .catch(err => console.log(err));

  }

  function endCall() {
    conversationsApi.postConversationDisconnect(currentConversationId)
    .then((response) => {
      writeToLog('Call ended');
      currentConversationId = null;
    })
    .catch(err => console.log(err));
  }

  function answerCall() {
    if (!currentSessionId) {
      writeToLog('There is no session to connect to');
      return;
    }

    webrtc_sdk.acceptPendingSession(currentSessionId);
  }

  function disconnectSdk() {
    const reallyDisconnect = confirm('Are you sure you want to disconnect?')
    if (!reallyDisconnect) {
      return;
    }

    webrtc_sdk.disconnect();
    writeToLog('Disconnected -- Reauthenticate to reconnect');
    document.getElementById('app-controls').style.visibility = 'hidden';
    document.getElementById('auth-text').style.visibility = 'hidden';
  }

  function rejectCall() {
    writeToLog(`rejecting sessionId: ${currentSessionId}`);
    webrtc_sdk.rejectPendingSession(currentSessionId);
  }

  function clearLog() {
    document.getElementById('log-data').value = '';
  }

  function initControls() {
    document.getElementById('get-active-conversations').addEventListener('click', getActiveConversations);
    document.getElementById('outbound-call-start').addEventListener('click', makeOutboundCall);
    document.getElementById('outbound-call-end').addEventListener('click', endCall);
    document.getElementById('answer-inbound-call').addEventListener('click', answerCall);
    document.getElementById('inbound-call-end').addEventListener('click', endCall);
    document.getElementById('disconnect-sdk').addEventListener('click', disconnectSdk);
    document.getElementById('reject-inbound-call').addEventListener('click', rejectCall);
    document.getElementById('clear-log').addEventListener('click', clearLog);
  }

  initControls();
})();
