let directoryUI = {
    search(criteria, index, size, callback) {

        directory.search(criteria, index, size, (err, res) => {
            if(err) return callback(err);

            let results = [];

            res.forEach((row,i) => {

                //buildfire.appData.delete(row.id,"userDirectory",e=>{});
                //return;

                let dUser=row.data;



                let imageUrl = buildfire.auth.getUserPictureUrl({ email:dUser.email});
                imageUrl = buildfire.imageLib.cropImage(imageUrl,{width:64,height:64})



                results.push({
                    title: dUser.displayName + ( (index* size) + i)
                    , imageUrl:  imageUrl
                    , description: dUser.email
                    /*, toolbar: [{
                        key: "btnBadge"
                        , class: "toolbarBadge"
                        , text: "9"
                    }, {
                        key: "btnShare"
                        , class: "toolbarShare"
                        , text: "share"
                    }]*/
                    , data: dUser
                });
            });

            if(callback) callback(null,results);

        });


    },

    promptUser:(withCheck)=> {

        if(withCheck) {
            if (localStorage.getItem("$$userDirectoryPrompt") == "true") {
                return;
            }
        }

        function login(callback) {
            buildfire.auth.getCurrentUser((err, user) => {
                if (!user) {
                    buildfire.auth.login({ allowCancel: true }, (err, user) => {
                        if (!user)
                            callback();
                        else
                            callback(null, user);
                    });
                }
                else
                    callback(null, user);
            });

        };


        buildfire.notifications.showDialog({
            title: "User Directory"
            , message: "Would you like to join our user directory?"
            , buttons: [{ text: 'No', key: 'no', type: 'default' }, { text: 'Yes', key: 'yes', type: 'success' }]
        }, function (e, data) {
            if (e) return console.error(e);
            if (data && data.selectedButton && data.selectedButton.key == "yes") {

                login((err, user) => {
                    if (user) {
                        // save to database
                        let dUser = new directoryUser(user);
                        directory.addUser(dUser, (e) => {
                            if (e) console.error(e);
                        });
                    }
                });
            };
            localStorage.setItem("$$userDirectoryPrompt", "true")
        });
    }


};