/** Android app links: lets the site owner's Android app open links to their site. Set in Integrations › Android app links. */
export default defineEventHandler(async (event) => {
    const site = await resolveTenant(event)
    const { pkg, prints } = androidAppLinksParts(site?.integrations?.androidAppLinks)
    if (!pkg || !prints.length) throw createError({ statusCode: 404, statusMessage: 'Not found' })
    setResponseHeaders(event, { 'content-type': 'application/json', 'cache-control': 'public, max-age=3600' })
    return [{
        relation: ['delegate_permission/common.handle_all_urls'],
        target: { namespace: 'android_app', package_name: pkg, sha256_cert_fingerprints: prints }
    }]
})
