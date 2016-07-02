import {assert} from 'chai';
import md5 from 'md5';
import mapper from '../../../../lib/api/users/mapper';
import any from '../../../helpers/any-for-api';

function assertUserMappedToViewProperly(userView, user, size) {
    assert.deepEqual(userView, {
        id: user.id,
        'first-name': user['first-name'],
        'last-name': user['last-name'],
        avatar: {
            src: `https://www.gravatar.com/avatar/${md5(user.email)}?size=${size}`,
            size
        }
    });
}

suite('user mapper', () => {
    test('that a user is mapped to the view representation', () => {
        const
            user = any.resources.user(),
            size = any.integer();

        assertUserMappedToViewProperly(mapper.mapToView(user, size), user, size);
    });

    test('that a list of users is mapped to a list of user view objects', () => {
        const
            users = any.listOf(any.resources.user),
            size = any.integer(),
            userViews = mapper.mapListToView(users, size);

        users.forEach((user, index) => {
            assertUserMappedToViewProperly(userViews[index], user, size);
        });
    });

    test('that email is populated when authorized', () => {
        const
            user = any.resources.user(),
            size = any.integer();

        assert.equal(mapper.mapToView(user, size, any.listOf(any.string)).email, user.email);
    });

    test('that email is populated in each item in list when authorized', () => {
        const
            users = any.listOf(any.resources.user),
            size = any.integer(),
            userViews = mapper.mapListToView(users, size, any.listOf(any.string));

        users.forEach((user, index) => {
            assert.equal(userViews[index].email, user.email);
        });
    });
});
