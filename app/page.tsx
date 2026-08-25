import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from './chatgpt-auth';
import { GalleryClient } from './gallery-client';
import { getEditorState, getGallerySnapshot } from '@/lib/gallery';
import type { ViewerState } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getChatGPTUser();
  const [snapshot, access] = await Promise.all([
    getGallerySnapshot(),
    getEditorState(user?.userId ?? null),
  ]);
  const viewer: ViewerState = {
    isSignedIn: Boolean(user),
    isEditor: access.isEditor,
    isOwner: false,
    canClaimOwnership: access.canClaimOwnership,
    displayName: user?.displayName ?? null,
    email: user?.email ?? null,
  };

  return (
    <GalleryClient
      initialSnapshot={snapshot}
      viewer={viewer}
      signInPath={chatGPTSignInPath('/')}
      signOutPath={chatGPTSignOutPath('/')}
    />
  );
}
