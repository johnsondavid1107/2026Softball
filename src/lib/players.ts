/**
 * Roster data. Currently a hardcoded placeholder — once the admin panel + KV
 * are wired, this module will read from KV and the admin will CRUD players
 * through the UI. The Player and WalkOutSong types are the source of truth
 * and will not change when we swap the data source.
 */

export type WalkOutSong = {
  trackName: string;
  artistName: string;
  /**
   * Direct 30-second mp3/aac preview URL from iTunes Search API.
   * Optional — when a parent uses "Add anyway" because their song wasn't
   * found, we save the text only and leave this empty.
   */
  previewUrl?: string;
  /** 100px album art URL. Optional for the same reason as previewUrl. */
  artworkUrl?: string;
};

export type Player = {
  id: string;
  firstName: string;
  jerseyNumber: number;
  song?: WalkOutSong;
};

/**
 * Dummy roster — first names only, fictional. Replace with the real team via
 * the admin panel once it's wired. Songs use real iTunes preview URLs so the
 * play buttons work end-to-end without any backend.
 */
export const PLACEHOLDER_ROSTER: Player[] = [
  {
    id: "p1",
    firstName: "Ava",
    jerseyNumber: 1,
    song: {
      trackName: "Roar",
      artistName: "Katy Perry",
      previewUrl:
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/21/a8/76/21a87607-1fe3-2bd2-753c-0b4b73c22b90/mzaf_9666996724668759977.plus.aac.p.m4a",
      artworkUrl:
        "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/36/21/81/36218129-51b4-df22-cafb-8e9503b53147/13UAAIM70445.rgb.jpg/100x100bb.jpg",
    },
  },
  {
    id: "p2",
    firstName: "Mia",
    jerseyNumber: 3,
    song: {
      trackName: "Shake It Off",
      artistName: "Taylor Swift",
      previewUrl:
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/11/d5/6d/11d56d4a-ce23-e793-8681-70dc4d35d931/mzaf_5886436202259848624.plus.aac.p.m4a",
      artworkUrl:
        "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/a7/98/d8/a798d867-344d-2bf2-fbfe-d2d1412dcef8/14UMDIM03793.rgb.jpg/100x100bb.jpg",
    },
  },
  {
    id: "p3",
    firstName: "Charlotte",
    jerseyNumber: 5,
    song: {
      trackName: "Eye of the Tiger",
      artistName: "Survivor",
      previewUrl:
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/fe/fa/9e/fefa9edd-c023-4d1c-1012-08bfb0ec69e6/mzaf_4651653238471209843.plus.aac.p.m4a",
      artworkUrl:
        "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/f9/02/8f/f9028f63-7a55-235e-f789-1e8946430fa2/614223201122.jpg/100x100bb.jpg",
    },
  },
  {
    id: "p4",
    firstName: "Sophia",
    jerseyNumber: 7,
    song: {
      trackName: "Don't Stop Believin' (2022 Remaster)",
      artistName: "Journey",
      previewUrl:
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview122/v4/f7/fe/40/f7fe405a-0526-60b5-9898-b555e4146c8d/mzaf_11089651359573769705.plus.aac.p.m4a",
      artworkUrl:
        "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/47/d6/fe/47d6fe2f-b14c-d8a7-597c-8a40e094364e/886449932795.jpg/100x100bb.jpg",
    },
  },
  {
    id: "p5",
    firstName: "Olivia",
    jerseyNumber: 8,
    song: {
      trackName: "We Will Rock You",
      artistName: "Queen",
      previewUrl:
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/e9/37/42/e9374231-9cef-ad56-365c-a7ba09e4fa55/mzaf_10566507321838390251.plus.aac.p.m4a",
      artworkUrl:
        "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/4d/08/2a/4d082a9e-7898-1aa1-a02f-339810058d9e/14DMGIM05632.rgb.jpg/100x100bb.jpg",
    },
  },
  {
    id: "p6",
    firstName: "Emma",
    jerseyNumber: 11,
    song: {
      trackName: "Centerfield",
      artistName: "John Fogerty",
      previewUrl:
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/a8/4a/46/a84a4639-003f-07c8-603c-255bcc62b048/mzaf_4870290721376192891.plus.aac.p.m4a",
      artworkUrl:
        "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/36/51/62/36516278-bdca-b907-1d4e-7558b4bdf9d8/25CRGIM51047.rgb.jpg/100x100bb.jpg",
    },
  },
  {
    id: "p7",
    firstName: "Lily",
    jerseyNumber: 12,
    song: {
      trackName: "Good as Hell",
      artistName: "Lizzo",
      previewUrl:
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/89/6c/a2/896ca254-3673-f66d-261c-30644eb5004a/mzaf_12055454568932010560.plus.aac.p.m4a",
      artworkUrl:
        "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/7f/d4/43/7fd443a8-861d-dd70-27a1-f23e221883dc/075679905956.jpg/100x100bb.jpg",
    },
  },
  {
    id: "p8",
    firstName: "Zoe",
    jerseyNumber: 14,
    song: {
      trackName: "Thunderstruck",
      artistName: "AC/DC",
      previewUrl:
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/a0/fb/99/a0fb995a-6e93-c67b-846b-8c81a54748c9/mzaf_2311271038340188410.plus.aac.p.m4a",
      artworkUrl:
        "https://is1-ssl.mzstatic.com/image/thumb/Features125/v4/bb/a2/f0/bba2f0d7-4d9e-c617-d49e-3ae02fd5d440/dj.xbkfgllk.jpg/100x100bb.jpg",
    },
  },
  // One player with no song yet — shows the empty-state styling on the card.
  {
    id: "p9",
    firstName: "Harper",
    jerseyNumber: 17,
  },
];
