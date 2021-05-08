import { useRef, useEffect, useState } from "react";
import io from "socket.io-client";

function App() {
  const remoteVideoref = useRef();
  const localVideoref = useRef();
  const textref = useRef();
  const pc = useRef();
  const socketRef = useRef();
  const [list, setList] = useState([]);
  // const [checkCandiadatae, setcheckCandiadatae] = useState(false);

  useEffect(() => {
    socketRef.current = io("https://rntestapibackend.herokuapp.com/");
    socketRef.current.emit("new people join", "data");
    socketRef.current.on("exited people", (payload) => {
      setList(payload);
    });
    socketRef.current.on("send to every one", (payload) => {
      setList((prev) => [...prev, payload]);
    });
    socketRef.current.on("signal receive user", (payload) => {
      const { user, sdp } = payload;
      console.log("data received");
      setRemoteDescription(sdp);
      createAnswer(user);
    });
    socketRef.current.on("return signal to origin", (payload) => {
      const { sdp, candidate } = payload;
      setRemoteDescription(sdp);
      addCandidate(candidate);
    });
    const pc_config = {
      iceServers: [
        {
          // urls: 'stun:[STUN_IP]:[PORT]',
          // 'credentials': '[YOR CREDENTIALS]',
          // 'username': '[USERNAME]'
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
            "stun:stun3.l.google.com:19302",
            "stun:stun4.l.google.com:19302",
            "stun:stun.rixtelecom.se",
            "stun:stun.schlund.de",
            "stun:stun.stunprotocol.org:3478",
            "stun:stun.voiparound.com",
            "stun:stun.voipbuster.com",
            "stun:stun.voipstunt.com",
            "stun:stun.voxgratia.org",
          ],
        },
      ],
    };

    pc.current = new RTCPeerConnection(pc_config);
    // pc.current.onicecandidate = (e) => {
    //   // send the candidates to the remote peer
    //   // see addCandidate below to be triggered on the remote peer
    //   if (e.candidate) {
    //     console.log(JSON.stringify(e.candidate))
    //     // return e.candidate

    //   };
    // };
    pc.current.oniceconnectionstatechange = (e) => {
      // console.log(JSON.stringify(e));
    };
    pc.current.ontrack = (e) => {
      remoteVideoref.current.srcObject = e.streams[0];
    };
    const constraints = {
      audio: true,
      video: true,
      // video: {
      //   width: 1280,
      //   height: 720
      // },
      // video: {
      //   width: { min: 1280 },
      // }
    };
    const success = (stream) => {
      window.localStream = stream;
      localVideoref.current.srcObject = stream;
      pc.current.addStream(stream);
    };

    // called when getUserMedia() fails - see below
    const failure = (e) => {
      console.log("getUserMedia Error: ", e);
    };
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(success)
      .catch(failure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //action
  const createOffer = (id) => {
    // console.log("Offer");

    // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createOffer
    // initiates the creation of SDP
    pc.current.createOffer({ offerToReceiveVideo: 1 }).then((sdp) => {
      // console.log(JSON.stringify(sdp));
      pc.current.setLocalDescription(sdp);

      socketRef.current.emit("send signal to other user", {
        user: list[id],
        sdp,
      });
      // set offer sdp as local description
    });
  };
  const createAnswer = (sendTo) => {
    // console.log("Answer");
    pc.current.createAnswer({ offerToReceiveVideo: 1 }).then((sdp) => {
      // console.log(JSON.stringify(sdp));

      // set answer sdp as local description
      pc.current.setLocalDescription(sdp);
      // console.log("data reach");
      pc.current.onicecandidate = (e) => {
        // send the candidates to the remote peer
        // see addCandidate below to be triggered on the remote peer
        // console.log("probleam at here");
        if (e.candidate) {
          // console.log(JSON.stringify(e.candidate));
          const candidate = e.candidate;
          socketRef.current.emit("return signal", { sdp, sendTo, candidate });
        }
      };
    });
  };
  const setRemoteDescription = (sdp) => {
    // retrieve and parse the SDP copied from the remote peer
    // const desc = JSON.parse(textref.current.value);

    // set sdp as remote description
    pc.current.setRemoteDescription(new RTCSessionDescription(sdp));
  };
  const addCandidate = (candidate) => {
    // retrieve and parse the Candidate copied from the remote peer
    // const candidate = JSON.parse(textref.current.value);
    // console.log("Adding candidate:", candidate);

    // add the candidate to the peer connection

    pc.current.addIceCandidate(new RTCIceCandidate(candidate));
  };

  return (
    <div className="App">
      <video
        style={{
          width: 240,
          height: 240,
          margin: 5,
          backgroundColor: "black",
        }}
        ref={localVideoref}
        autoPlay
        muted
      ></video>
      <video
        style={{
          width: 240,
          height: 240,
          margin: 5,
          backgroundColor: "black",
        }}
        ref={remoteVideoref}
        autoPlay
      ></video>
      <div>
        {list.map((data, index) => (
          <button key={index} onClick={() => createOffer(index)}>
            {data}
          </button>
        ))}
      </div>

      <br />

      <button onClick={createOffer}>Offer</button>
      <button onClick={createAnswer}>Answer</button>

      <br />
      <textarea ref={textref} />

      <br />
      <button onClick={setRemoteDescription}>Set Remote Desc</button>
      <button onClick={addCandidate}>Add Candidate</button>
    </div>
  );
}

export default App;
