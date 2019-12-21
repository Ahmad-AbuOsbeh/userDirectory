class directoryUser {
    constructor(user) {
        this.displayName = user.displayName;
        this.firstName = user.firstName;
        this.lastName = user.lastName;
        this.email = user.email;
        this.userId = user._id || user.userId;
    }

    toJson(){
        return {
            displayName: this.displayName,
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            userId: this.userId,
            _buildfire :{ 
                index: {
                 text: `${this.firstName} ${this.lastName}`
                , string1: `${this.firstName} ${this.lastName}`
               }
           }
        }
    }

}