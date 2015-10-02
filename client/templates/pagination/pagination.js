//var currentPageTracker = new Tracker.Dependency;

Template.pagination.helpers({
	'pageNumber' : function(paginationData) {
		//currentPageTracker.depend()
		//pages from the dev's perspective are 0-indexed
		var pageArray = [];

		try {
			var paginationId = paginationData.identifier;
			var totalResults = paginationData.totalResults;
			var resultsPerPage = paginationData.resultsPerPage;
			var pageNumbersDisplayed = paginationData.pageNumbersDisplayed;

			var currentPage;
			if (Session.get(paginationId + '_current'))
				currentPage = Session.get(paginationId + '_current');

			else currentPage = 0;

			var pageCount = Math.floor(totalResults / resultsPerPage);
			if (totalResults % (pageCount * resultsPerPage) > 0)
				pageCount++;

			var last_page_index = pageCount - 1;

			var firstPageShown = Math.floor((currentPage / pageNumbersDisplayed)) * pageNumbersDisplayed;
			var lastPageShown = firstPageShown + pageNumbersDisplayed - 1;

			pageArray.push({
				'status' : (firstPageShown >= pageNumbersDisplayed) ? 'page-number-enabled blue' : 'page-number-disabled',
				'pageNum' : 0,
				'text' : '<<'
			});

			pageArray.push({
				'status' : (firstPageShown >= pageNumbersDisplayed) ? 'page-number-enabled blue' : 'page-number-disabled',
				'pageNum' : firstPageShown - 1,
				'text' : '<'
			});

			for (var i = 0; i < pageNumbersDisplayed; i++) {
				var page_status; 
				var page_index = firstPageShown + i;

				if (currentPage == page_index)
					page_status = "page-number-current";

				else if (page_index > last_page_index) 
					page_status = "page-number-disabled";

				else page_status = "page-number-enabled";

				pageArray.push({
					'status' : page_status,
					'pageNum' : page_index,
					'text' : firstPageShown + i + 1
				});
			}

			pageArray.push({
				'status' : (lastPageShown < pageCount) ? 'page-number-enabled blue' : 'page-number-disabled',
				'pageNum' : lastPageShown + 1,
				'text' : '>'
			});

			pageArray.push({
				'status' : (lastPageShown < pageCount) ? 'page-number-enabled blue' : 'page-number-disabled',
				'pageNum' : last_page_index,
				'text' : '>>'
			});
		}

		catch(error) {
			console.log(error.message);
		}

		return pageArray;
	}
})

Template.pagination.events({
	'click .page-number-enabled' : function(element) {
		var paginationId = $('.template-pagination').data('pagination-id');
        var pageNumber = element.target.dataset.page_number;
	    Session.set(paginationId + '_current', pageNumber);
    },
})