"use strict";
--Connection;
System;
Database;
Schema;
--This;
handles;
all;
connection;
requests;
between;
users;
CREATE;
TABLE;
IF;
NOT;
EXISTS;
connection_requests(id, INT, PRIMARY, KEY, AUTO_INCREMENT, requester_id, INT, NOT, NULL, receiver_id, INT, NOT, NULL, status, ENUM('pending', 'accepted', 'declined', 'blocked'), DEFAULT, 'pending', request_message, TEXT, created_at, TIMESTAMP, DEFAULT, CURRENT_TIMESTAMP, updated_at, TIMESTAMP, DEFAULT, CURRENT_TIMESTAMP, ON, UPDATE, CURRENT_TIMESTAMP, --Ensure, users, can, 't send multiple requests to the same person, UNIQUE, KEY, unique_request(requester_id, receiver_id), --Foreign, key, constraints, FOREIGN, KEY(requester_id), REFERENCES, users(id), ON, DELETE, CASCADE, FOREIGN, KEY(receiver_id), REFERENCES, users(id), ON, DELETE, CASCADE, --Indexes);
for (performance; INDEX; idx_requester(requester_id),
    INDEX)
    idx_receiver(receiver_id),
        INDEX;
idx_status(status),
    INDEX;
idx_created_at(created_at);
;
--Connection;
blocks;
table();
for (users; who; want)
    to;
block;
others;
CREATE;
TABLE;
IF;
NOT;
EXISTS;
user_blocks(id, INT, PRIMARY, KEY, AUTO_INCREMENT, blocker_id, INT, NOT, NULL, blocked_id, INT, NOT, NULL, reason, TEXT, created_at, TIMESTAMP, DEFAULT, CURRENT_TIMESTAMP, --Ensure, users, can, 't block the same person multiple times, UNIQUE, KEY, unique_block(blocker_id, blocked_id), --Foreign, key, constraints, FOREIGN, KEY(blocker_id), REFERENCES, users(id), ON, DELETE, CASCADE, FOREIGN, KEY(blocked_id), REFERENCES, users(id), ON, DELETE, CASCADE, --Indexes);
for (performance; INDEX; idx_blocker(blocker_id),
    INDEX)
    idx_blocked(blocked_id);
;
--Connection;
activity;
log();
for (tracking; connection; events)
    CREATE;
TABLE;
IF;
NOT;
EXISTS;
connection_activity(id, INT, PRIMARY, KEY, AUTO_INCREMENT, connection_id, INT, NOT, NULL, user_id, INT, NOT, NULL, action, ENUM('sent', 'received', 'accepted', 'declined', 'blocked', 'unblocked'), NOT, NULL, details, JSON, created_at, TIMESTAMP, DEFAULT, CURRENT_TIMESTAMP, --Foreign, key, constraints, FOREIGN, KEY(connection_id), REFERENCES, connection_requests(id), ON, DELETE, CASCADE, FOREIGN, KEY(user_id), REFERENCES, users(id), ON, DELETE, CASCADE, --Indexes);
for (performance; INDEX; idx_connection(connection_id),
    INDEX)
    idx_user(user_id),
        INDEX;
idx_action(action),
    INDEX;
idx_created_at(created_at);
;
//# sourceMappingURL=connectionSchema.js.map