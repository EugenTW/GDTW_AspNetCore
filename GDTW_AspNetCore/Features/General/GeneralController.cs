using Microsoft.AspNetCore.Mvc;

namespace GDTW_AspNetCore.Features.General;

public class General_Controller : Controller
{
    [HttpGet("")]
    public IActionResult IndexRoot()
    {
        var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "index.html");
        return PhysicalFile(filePath, "text/html");
    }

    [HttpGet("index")]
    public IActionResult IndexAddress()
    {
        var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "index.html");
        return PhysicalFile(filePath, "text/html");
    }

    [HttpGet("about_us")]
    public IActionResult AboutUs()
    {
        var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "about_us.html");
        return PhysicalFile(filePath, "text/html");
    }

    [HttpGet("show_statistics")]
    public IActionResult ShowStatistics()
    {
        return PhysicalFile(
            Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "show_statistics.html"),
            "text/html"
        );
    }

    [HttpGet("error_404")]
    public IActionResult HandleError404()
    {
        return PhysicalFile(
            Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "error_404.html"),
            "text/html"
        );
    }

    [HttpGet("error_410")]
    public IActionResult HandleError410()
    {
        return PhysicalFile(
            Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "error_410.html"),
            "text/html"
        );
    }

    [HttpGet("error_403_405")]
    public IActionResult HandleError403405()
    {
        return PhysicalFile(
            Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "error_403&405.html"),
            "text/html"
        );
    }

    [HttpGet("error_generic")]
    public IActionResult HandleErrorGeneric()
    {
        return PhysicalFile(
            Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "error_generic.html"),
            "text/html"
        );
    }

    [HttpGet("sitemap.xml")]
    public IActionResult GetSitemap()
    {
        var baseDir = Directory.GetCurrentDirectory();
        var filePath = Path.Combine(baseDir, "logs", "sitemap.xml");

        if (!System.IO.File.Exists(filePath))
        {
            return NotFound();
        }

        return PhysicalFile(filePath, "application/xml");
    }
}