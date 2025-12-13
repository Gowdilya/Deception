using Microsoft.AspNetCore.Mvc;
using DeceptionApi.Services;

namespace DeceptionApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GameController : ControllerBase
{
    private readonly GameService _gameService;

    public GameController(GameService gameService)
    {
        _gameService = gameService;
    }

    [HttpGet("state")]
    public IActionResult GetState()
    {
        return Ok(new { State = _gameService.GetCurrentState() });
    }

    [HttpPost("start")]
    public IActionResult StartGame()
    {
        _gameService.StartGame();
        return Ok(new { Message = "Game started", State = _gameService.GetCurrentState() });
    }
}