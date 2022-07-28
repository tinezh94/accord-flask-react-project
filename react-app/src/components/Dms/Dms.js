import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { sendDmMessage } from '../../store/chat';

let socket;


const DmChat = () => {
    const dispatch = useDispatch();

    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [users, setUsers] = useState([]);
    const [validationErrors, setValidationErrors] = useState([]);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const { userId } = useParams();
    let recipientId = Number(userId)

    const sessionUser = useSelector(state => state.session.user);

    useEffect(() => {
        async function fetchData() {
            const response = await fetch('/api/users/');
            const responseData = await response.json();
            setUsers(responseData.users);
        }
        fetchData();
    }, [])
    
    const sender = sessionUser;

    const recipient = users.filter(user => {
        return user.id === Number(recipientId)
    })

    console.log('frontend, recipient', recipient)


    console.log('sender ID: ', sessionUser.id);
    console.log('recipientId: ', recipientId);
    const joinedId = [sessionUser.id, recipientId].sort();
    const roomId = `${joinedId[0]}-${joinedId[1]}`;
    console.log('joining the two IDs: ', roomId);

    useEffect(() => {
        const errors = [];
        if (chatInput.length === 0) errors.push("Message body cannot be empty.");
    
        setValidationErrors(errors);
      }, [chatInput]);


    useEffect(() => {
        // create websocket
        socket = io();


        // if (socket && recipient && sessionUser) socket.emit("dm_join", {username: sessionUser.username, recipient: recipientId, sender:sessionUser.id })
        if (socket && recipient && sessionUser) socket.emit("dm_join", {username: sessionUser.username, dm_room_id: roomId })


        //listen for chat events
        socket.on('dm_chat', chat => {
            // when receive a chat, add to messages state var
            setMessages(messages => [...messages, chat]);
        })

        //when component unmounts, disconnect
        return (() => {
            // socket.removeAllListeners()
            socket.emit('dm_leave', {username: sessionUser.username, recipient: recipientId });
            socket.disconnect();
            setMessages([]);
        })
    }, [recipientId])

    const updateChatInput = e => {
        setChatInput(e.target.value);
    }

    const sendChat = async(e) => {
        e.preventDefault();
        setHasSubmitted(true);

        if (validationErrors.length === 0 ) {
            //emit a message
            if(recipient && sessionUser) socket.emit('dm_chat', { user: sessionUser.username, msg: chatInput, dm_room_id: roomId });

            const dateTime = new Date();
            const isoTime = dateTime.toISOString();
            const date = isoTime.slice(0, 10);
            const time = isoTime.slice(12,19);
            const combined = date + ' ' + time

            const payload = {
                sender_id: sessionUser.id,
                recipient_id: recipientId,
                message_body: chatInput,
                created_at: combined
            }

            await dispatch(sendDmMessage(payload));
            setHasSubmitted(false);
            setChatInput('');
        }


        //clear input field after message is sent
        setChatInput('');
    }


    return (
        <div>
            <div>
                {messages && messages.map((message, idx) => (
                    <div key={idx}>
                        {`${message.user}: ${message.msg}`}
                    </div>
                ))}
            </div>

            <form
                onSubmit={sendChat}
            >
                <input
                    value={chatInput}
                    onChange={updateChatInput}
                />
                <button
                // onClick={}
                >Send</button>
            </form>
        </div>
    )
}

export default DmChat;
