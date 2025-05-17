import React, { useState, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';

const Header = () => {
    const [showModal, setShowModal] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [users, setUsers] = useState([]);

    const currentUser = JSON.parse(localStorage.getItem("user")); // Assuming user info is stored in localStorage
 const token = localStorage.getItem("token")
    useEffect(() => {
        const fetchUsers = async () => {
            
    
            try {
        
                const response = await fetch(`http://localhost:3000/api/auth/users/${currentUser.id}`);
                if (!response.ok) throw new Error('Failed to fetch users');
                const data = await response.json();

                // Filter out the current user
                const filteredUsers = data.filter(user => user.id !== currentUser.id && user._id !== currentUser.id);

                setUsers(filteredUsers);
            } catch (err) {
                console.error('Error loading users:', err);
            }
        };

        if (currentUser?.id) {
            fetchUsers();
        }
    }, [currentUser?.id]);

    const toggleModal = () => {
        setShowModal(!showModal);
        setGroupName('');
        setSelectedUsers([]);
    };

    const handleUserSelect = (id) => {
        setSelectedUsers((prev) =>
            prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
        );
    };

    // const handleCreateGroup = () => {
    //     const groupData = {
    //         name: groupName,
    //         members: selectedUsers,
    //     };

    //     console.log('Creating group with data:', groupData);
    //     // TODO: Send groupData to backend via API
    //     toggleModal();
    // };
    const handleCreateGroup = async () => {
    const groupData = {
        name: groupName,
        members: [...selectedUsers, currentUser.id], // include self in the group
    };

    try {
        const response = await fetch('http://localhost:3000/api/chat/create-group', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}` // if your backend requires JWT
            },
            body: JSON.stringify(groupData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to create group');
        }

        alert('Group created successfully!');
        toggleModal(); // close modal
    } catch (err) {
        console.error('Error creating group:', err);
        alert('Error creating group. Please try again.');
    }
};


    return (
        <>
            <header className="bg-gray-700 text-white py-4 px-6 flex items-center justify-between shadow-md">
                <h1 className="text-xl font-bold">Chat App</h1>
                <div className="flex gap-2">
                    <button
                        onClick={toggleModal}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-1"
                    >
                        <FaPlus className="text-xs" />
                        <span>Create Group</span>
                    </button>
                    <button className="bg-blue-500 text-white px-4 py-2 rounded-lg">M</button>
                </div>
            </header>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-black">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Create Group</h2>

                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Group Name"
                            className="w-full border p-2 rounded mb-4"
                        />

                        <div className="mb-4 max-h-40 overflow-y-auto border p-2 rounded">
                            <p className="font-semibold mb-2">Select Users:</p>
                            {users.map((user) => (
                                <label key={user.id || user._id} className="flex items-center gap-2 mb-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(user.id || user._id)}
                                        onChange={() => handleUserSelect(user.id || user._id)}
                                    />
                                    {user.name}
                                </label>
                            ))}
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                className="px-4 py-2 bg-gray-300 rounded"
                                onClick={toggleModal}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-blue-500 text-white rounded"
                                onClick={handleCreateGroup}
                                disabled={!groupName || selectedUsers.length === 0}
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
