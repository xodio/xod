import { curry } from 'ramda';
import URL from 'url-parse';

// :: String -> String -> { utm_source :: String, utm_campaign :: String, utm_medium :: String}
const getUtmParams = (campaign, medium) => ({
  utm_source: process.env.XOD_UTM_SOURCE,
  utm_campaign: campaign,
  utm_medium: medium,
});

// :: String -> String -> String -> String -> String
const getUtmUrl = curry((hostname, path, campaign, medium) =>
  new URL(path, hostname)
    .set('query', getUtmParams(campaign, medium))
    .toString()
);

/**
 * Returns url to XOD website with some path (it could be an empty string).
 * Accepts path (without hostname), utm campaign name and utm medium name
 * @type {[type]}
 */
// :: String -> String -> String -> String
export const getUtmSiteUrl = getUtmUrl(process.env.XOD_SITE_DOMAIN);

/**
 * Returns url to forum with utm query params.
 * Accepts only one argument: medium.
 */
// :: String -> String
export const getUtmForumUrl = getUtmUrl(process.env.XOD_FORUM_DOMAIN, '', 'forum');
