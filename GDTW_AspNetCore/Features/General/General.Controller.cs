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
    
    
    
    
}