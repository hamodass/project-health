import {UserRecord} from '../../server/models/userModel';
import {getTestTokens} from '../get-test-tokens';

export const FAKE_USERNAME = 'fake-username';

export function newFakeUserRecord() {
  const fakeRecord: UserRecord = {
    username: FAKE_USERNAME,
    githubToken: getTestTokens()['project-health1'] || 'fake-token',
    scopes: ['repo'],
    avatarUrl: 'https://example.com/avatar.png',
    fullname: 'Fakey McFakeFace',
    lastKnownUpdate: null,
    featureLastViewed: {
      enabledAt: Date.now(),
    },
  };

  return Object.assign({}, fakeRecord);
}