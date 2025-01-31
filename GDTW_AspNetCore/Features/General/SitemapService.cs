namespace GDTW_AspNetCore.Features.General;

using System.Xml.Linq;

public class SitemapService
{
    
    private readonly IConfiguration _configuration;
    public SitemapService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public void GenerateSitemap()
    {
       
        var fullUrl = _configuration["App:FullUrl"];
        var siteMapPath = _configuration["App:SiteMapPath"];

        if (!Directory.Exists(siteMapPath))
        {
            Directory.CreateDirectory(siteMapPath);
        }
       
        XNamespace ns = "http://www.sitemaps.org/schemas/sitemap/0.9";
        var urlset = new XElement(ns + "urlset");
        var urls = new List<string>
        {
            $"{fullUrl}/",
            $"{fullUrl}/index",
            $"{fullUrl}/short_url",
            $"{fullUrl}/short_url_redirection",
            $"{fullUrl}/terms_of_service",
            $"{fullUrl}/about_us",
            $"{fullUrl}/contact_us",
            $"{fullUrl}/error",
            $"{fullUrl}/image_view",
            $"{fullUrl}/image_share",
            $"{fullUrl}/error_404",
            $"{fullUrl}/error_410",
            $"{fullUrl}/error_403_405",
            $"{fullUrl}/error_generic"
        };

        foreach (var url in urls)
        {
            var urlElement = new XElement(ns + "url",
                new XElement(ns + "loc", url)
            );
            urlset.Add(urlElement);
        }

        var sitemapDoc = new XDocument(urlset);

        var sitemapFile = Path.Combine(siteMapPath, "sitemap.xml");
        sitemapDoc.Save(sitemapFile);
    }
}