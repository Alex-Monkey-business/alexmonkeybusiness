/**
 * The front page's photograph — kuhnmi's Matterhorn from the north-east,
 * Wikimedia Commons, CC BY 2.0, graded and cut to the silhouette by us.
 *
 * CC BY asks for the author, the licence and a note that the work was
 * altered. That line used to sit on the page itself, on a black plate over
 * the snow; Alex had the plate removed (14 Sep 2026). It now lives in the
 * menu panel's foot — the one surface of the site that is reliably black at
 * every width — and the routes that show the photograph pass it to Layout.
 */
export interface PhotoCredit {
  author: string;
  source: string;
  licence: string;
  licenceUrl: string;
}

export const matterhornCredit: PhotoCredit = {
  author: 'kuhnmi',
  source: 'https://commons.wikimedia.org/wiki/File:Alps_of_Switzerland_Matterhorn_(23979169808).jpg',
  licence: 'CC BY 2.0',
  licenceUrl: 'https://creativecommons.org/licenses/by/2.0/',
};
