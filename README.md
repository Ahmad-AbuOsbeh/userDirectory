# User Directory Plugin

This plugin features reserved collections in `appData` and `searchEngine`. The collections are as follows:

## Users
The `Users` collection uses the tag `$$userDirectory` in `appData`. This tag can be referenced via a `static get tag` on the `Users` class.

In addition, this collection can use `userId` to search for one or more specific users. See `lookup` below.

## Lookup
The `Lookup` collection uses the tag `$$userDirectory` in `searchEngine`. This tag can be referenced via a `static get tag` on the `Lookup` class.

This collection provides a robust and flexible way to search for users using an elastic search. `Lookup` will return an array of `userId`s that can be passed to `Users.search`.

## Favorites
The `Favorites` collection uses the tag `$$favorites` in `appData` to store an array of `userId`s. This class must be instantiated.

## Badges
The `Badges` collection uses the tag `$$badges` in `appData`. This tag can be referenced via a `static get tag` on the `Badges` class.

## Reports
The `Reports` collection uses the tag `$$reports` in `appData`. This tag can be referenced via a `static get tag` on the `Reports` class.
