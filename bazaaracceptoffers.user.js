// ==UserScript==
// @name        Bazaar.tf Accept All Trade Offers
// @namespace   http://www.doctormckay.com
// @version     1.2.1
// @description Adds a button to the trade offers page to accept all offers
// @match       http://bazaar.tf/my/tradeoffers
// @require     http://ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.js
// @grant       GM_xmlhttpRequest
// ==/UserScript==

var g_sessionID;

$(document).ready(function() {
	var buttons = $('.btn-success');

	if(buttons.length > 0) {
		var button = $('<button class="btn btn-success btn-lg pull-right" disabled>Accept All</button>');
		$('.page-header').append(button);
		
		GM_xmlhttpRequest({
			"method": "GET",
			"url": "https://steamcommunity.com/my/tradeoffers",
			"onload": function(response) {
				if(!response.responseText) {
					button.text('Error');
					return;
				}
				
				var match = response.responseText.match(/g_sessionID = "(.+)";/);
				if(match) {
					g_sessionID = match[1];
					button.prop('disabled', false);
				}
			}
		})
		
		button.click(function() {
			$(this).prop('disabled', true);
			var items = [];
			for(var i = 0; i < buttons.length; i++) {
				var button = $(buttons[i]);
				var offerid = button.attr('href').match(/\/tradeoffer\/(\d+)\/?/)[1];
				var steamid = button.parent().parent().find('a.rank').attr('href').match(/\/profiles\/(\d+)\/?/)[1];
				var row = button.parent().parent().parent().parent();
				var icon = row.find('.fa-clock-o');
				if(!icon) {
					continue;
				}
				
				items.push({
					"offerid": offerid,
					"steamid": steamid,
					"icon": icon
				});
			}
			
			acceptOffers(items);
		});
	}
});

function acceptOffers(rows) {
	if(rows.length === 0) {
		return;
	}
	
	var offer = rows.splice(0, 1)[0];
	offer.icon.removeClass('fa-clock-o').addClass('fa-spinner fa-spin');
	GM_xmlhttpRequest({
		"method": "POST",
		"url": "https://steamcommunity.com/tradeoffer/" + offer.offerid + "/accept",
		"data": "sessionid=" + encodeURIComponent(g_sessionID) + "&serverid=1&tradeofferid=" + offer.offerid + "&partner=" + offer.steamid,
		"headers": {
			"Content-Type": "application/x-www-form-urlencoded",
			"Referer": "https://steamcommunity.com/tradeoffer/" + offer.offerid + "/"
		},
		"onload": function(response) {
			if(!response.responseText) {
				offer.icon.removeClass('fa-spinner fa-spin').addClass('fa-times-circle-o');
				acceptOffers(rows);
				return;
			}
			
			try {
				var json = JSON.parse(response.responseText);
				if(json.needs_mobile_confirmation) {
					offer.icon.removeClass('fa-spinner fa-spin').addClass('fa-mobile');
				} else if(json.needs_email_confirmation) {
					offer.icon.removeClass('fa-spinner fa-spin').addClass('fa-envelope-o');
				} else if(!json.tradeid) {
					offer.icon.removeClass('fa-spinner fa-spin').addClass('fa-times-circle-o');
				} else {
					offer.icon.removeClass('fa-spinner fa-spin').addClass('fa-check-circle-o');
				}
			} catch(e) {
				offer.icon.removeClass('fa-spinner fa-spin').addClass('fa-times-circle-o');
			}
			
			acceptOffers(rows);
		}
	});
}
