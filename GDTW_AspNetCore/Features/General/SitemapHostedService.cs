namespace GDTW_AspNetCore.Features.General;

using Microsoft.Extensions.Hosting;

public class SitemapHostedService : IHostedService
{
    private readonly SitemapService _sitemapService;

    public SitemapHostedService(SitemapService sitemapService)
    {
        _sitemapService = sitemapService;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        _sitemapService.GenerateSitemap();
        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
        => Task.CompletedTask;
}