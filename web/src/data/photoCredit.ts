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
  /** What is credited, when it is not a photograph — e.g. height data. */
  kind?: { nb: string; en: string };
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

/** The climb's mountain: swissALTI3D heights and the SWISSIMAGE orthophoto,
 *  open government data that asks for the source to be named. */
export const swisstopoCredit: PhotoCredit = {
  kind: { nb: 'Høydedata og ortofoto', en: 'Height data and orthophoto' },
  author: 'swisstopo',
  source: 'https://www.swisstopo.admin.ch/',
  licence: 'OGD',
  licenceUrl: 'https://www.geo.admin.ch/en/general-terms-of-use-fsdi',
};

/** Where swissALTI3D has no tiles, on the Italian side, the heights are the
 *  Copernicus GLO-30 DSM, whose licence asks for this line. */
export const copernicusCredit = {
  text: 'Copernicus WorldDEM-30 © DLR e.V. 2010–2014 and © Airbus Defence and Space GmbH 2014–2018, provided under COPERNICUS by the European Union and ESA',
  source: 'https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM',
};
