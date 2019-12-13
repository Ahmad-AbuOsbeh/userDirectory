let directoryUI = {
    search(criteria, index, size, callback) {

        directory.search(criteria, index, size, (err, res) => {
            let results = [];
            res.forEach(dUser => {

                let imageUrl = buildfire.auth.getUserPictureUrl({ email:dUser.email});
                //imageUrl = buildfire.imageLib



                results.push({
                    title: dUser.displayName
                    , imageUrl: "https://img.icons8.com/ios/72/worldwide-location.png"
                    , description: "Blah blah blah"
                    , toolbar: [{
                        key: "btnBadge"
                        , class: "toolbarBadge"
                        , text: "9"
                    }, {
                        key: "btnShare"
                        , class: "toolbarShare"
                        , text: "share"
                    }]
                    , data: {
                        key1: "1"
                        , key2: "2"
                    }
                })
            })

        });


    }




}